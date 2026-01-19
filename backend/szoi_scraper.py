import os
import re
import json
import time
import unicodedata
from pathlib import Path
from typing import List, Dict, Any, Optional, Set

from bs4 import BeautifulSoup

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException


# =========================================================
# KONFIG
# =========================================================

BASE_URL = "https://szoi-test.nfz-lublin.pl"
LOGIN_URL = f"{BASE_URL}/ap-mzwi/#login"
PERSONNEL_URL = f"{BASE_URL}/ap-mzwi-sso/user/persmed/zatprsmed@default"

OUT_JSON = "employees_import.json"

SZOI_LOGIN = os.environ.get("SZOI_LOGIN", "SU2WAZNY")
SZOI_PASSWORD = os.environ.get("SZOI_PASSWORD", "Wazniak777!")

# Auto-detect Docker environment
IS_DOCKER = os.path.exists('/.dockerenv') or os.environ.get('DOCKER_CONTAINER', False)
HEADLESS = IS_DOCKER or os.environ.get("HEADLESS", "false").lower() == "true"
LIMIT_EMPLOYEES = 20  # type: Optional[int]  # np. 20 do testow, None = wszyscy

MAX_SCROLL_PASSES = 80
PESEL_RE = re.compile(r"\b\d{11}\b")


# =========================================================
# MAPOWANIA POD BAZE (1:1 z CSV)
# =========================================================

def _norm_key(s: str) -> str:
    s = (s or "").strip().lower()
    s = unicodedata.normalize("NFKD", s)
    s = "".join(ch for ch in s if not unicodedata.combining(ch))
    s = re.sub(r"\s+", " ", s)
    return s


TYP_PERSONELU_MAP = {
    _norm_key("inny"): 1,
    _norm_key("lekarz"): 2,
    _norm_key("polozna"): 3,
    _norm_key("pielegniarka"): 4,
    _norm_key("felczer"): 6,
    _norm_key("rehabilitant/fizykoterapeuta"): 7,
    _norm_key("Psycholog"): 8,
    _norm_key("asystentka stomatologiczna"): 9,
    _norm_key("diagnosta laboratoryjny"): 10,
    _norm_key("dietetyk"): 11,
    _norm_key("farmaceuta"): 12,
    _norm_key("higienistka stomatologiczna"): 13,
    _norm_key("higienistka szkolna"): 14,
    _norm_key("instruktor higieny"): 15,
    _norm_key("instruktor terapii uzaleznien /specjalista terapii uzaleznien"): 16,
    _norm_key("lekarz dentysta"): 17,
    _norm_key("masazysta (technik masazysta)"): 18,
    _norm_key("opiekunka dziecieca"): 19,
    _norm_key("optometrysta"): 20,
    _norm_key("Logopeda"): 21,
    _norm_key("Ratownik Medyczny"): 22,
    _norm_key("ortoptystka"): 23,
    _norm_key("protetyk sluchu"): 24,
    _norm_key("psychoterapeuta"): 25,
    _norm_key("specjalista zdrowia publicznego (lic+mgr na kierunku zdrowie publiczne)"): 27,
    _norm_key("technik analityki medycznej"): 28,
    _norm_key("technik dentystyczny"): 29,
    _norm_key("technik farmaceutyczny"): 30,
    _norm_key("technik elektroniki medycznej"): 31,
    _norm_key("technik elektroradiolog"): 32,
    _norm_key("technik optyk"): 33,
    _norm_key("technik ortopeda"): 34,
    _norm_key("terapeuta zajeciowy"): 35,
    _norm_key("specjalista psychoterapii uzaleznien"): 36,
    _norm_key("opiekun medyczny"): 37,
    _norm_key("pedagog specjalny"): 38,
    _norm_key("terapeuta srodowiskowy "): 39,
}


# =========================================================
# HELPERY
# =========================================================

def norm(s: Optional[str]) -> Optional[str]:
    if not s:
        return None
    s = re.sub(r"\s+", " ", s).strip()
    return None if s in ("-", "-") else s


def extract_after(label: str, text: str) -> Optional[str]:
    if not text:
        return None
    m = re.search(rf"{label}\s*:\s*([0-9\-]+)", text)
    return m.group(1) if m else None


def extract_name_after(label: str, text: str) -> Optional[str]:
    if not text:
        return None
    m = re.search(rf"{label}\s*:\s*(.+)", text)
    return m.group(1).strip() if m else None


# =========================================================
# SELENIUM
# =========================================================

def create_driver() -> webdriver.Chrome:
    options = webdriver.ChromeOptions()
    
    # Docker/headless-specific options
    if HEADLESS or IS_DOCKER:
        options.add_argument("--headless=new")
        options.add_argument("--no-sandbox")
        options.add_argument("--disable-dev-shm-usage")
        options.add_argument("--disable-gpu")
        options.add_argument("--remote-debugging-port=9222")
        options.add_argument("--window-size=1920,1080")
    
    options.add_argument("--start-maximized")
    options.add_argument("--disable-logging")
    options.add_argument("--log-level=3")
    
    return webdriver.Chrome(options=options)


def login(driver: webdriver.Chrome):
    driver.get(LOGIN_URL)
    wait = WebDriverWait(driver, 30)

    wait.until(EC.presence_of_element_located((By.NAME, "loginField"))).send_keys(SZOI_LOGIN)
    wait.until(EC.presence_of_element_located((By.NAME, "passwordField"))).send_keys(SZOI_PASSWORD)

    wait.until(
        EC.element_to_be_clickable(
            (By.XPATH, "//div[@role='button' and contains(@class,'c-login-submit-button')]")
        )
    ).click()

    wait.until(EC.url_contains("#main"))


def click_tab(driver: webdriver.Chrome, href_part: str) -> bool:
    try:
        tab = driver.find_element(By.XPATH, f"//a[contains(@href,'{href_part}')]")
        driver.execute_script("arguments[0].click();", tab)
        time.sleep(0.6)
        return True
    except Exception:
        return False


def open_employee_preview_by_pesel(driver: webdriver.Chrome, pesel: str, timeout: int = 25) -> bool:
    wait = WebDriverWait(driver, timeout)
    wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "table.table-dynamic")))

    row_xpath = (
        f"//table[contains(@class,'table-dynamic')]"
        f"//tr[.//*[contains(normalize-space(.), '{pesel}')]]"
    )

    try:
        row = wait.until(EC.presence_of_element_located((By.XPATH, row_xpath)))
    except TimeoutException:
        return False

    link_xpath = ".//a[.//span[contains(normalize-space(.), 'poglad zatrudnienia')] or contains(normalize-space(.), 'poglad zatrudnienia') or contains(normalize-space(.), 'poglad')]"

    try:
        link = row.find_element(By.XPATH, link_xpath)
    except Exception:
        try:
            link = row.find_element(By.XPATH, ".//a[contains(@href,'zatprsmedcard@')]")
        except Exception:
            return False

    driver.execute_script("arguments[0].scrollIntoView({block:'center'});", link)
    time.sleep(0.2)
    driver.execute_script("arguments[0].click();", link)

    try:
        wait.until(lambda d: "zatrudniony personel" in (d.page_source or "").lower())
        return True
    except TimeoutException:
        return False


def go_back_to_list(driver: webdriver.Chrome, timeout: int = 20):
    wait = WebDriverWait(driver, timeout)
    try:
        back_link = wait.until(
            EC.element_to_be_clickable((By.XPATH, "//a[contains(normalize-space(.), 'Powrot do zatrudnionego personelu') or contains(normalize-space(.),'Powrot')]"))
        )
        driver.execute_script("arguments[0].click();", back_link)
    except Exception:
        driver.back()

    wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "table.table-dynamic")))
    time.sleep(0.5)


# =========================================================
# VAADIN LISTA - ROBUST: ZBIERAJ PESEL Z TEKSTU WIERSZY
# =========================================================

def _visible_pesels_from_rows(driver: webdriver.Chrome) -> List[str]:
    pesels = []
    rows = driver.find_elements(By.XPATH, "//table[contains(@class,'table-dynamic')]//tr")
    for r in rows:
        txt = (r.text or "").strip()
        for m in PESEL_RE.findall(txt):
            pesels.append(m)
    return pesels


def collect_all_pesels_with_scroll(driver: webdriver.Chrome, timeout: int = 35) -> List[str]:
    wait = WebDriverWait(driver, timeout)
    wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "table.table-dynamic")))

    wait.until(lambda d: len(_visible_pesels_from_rows(d)) > 0)

    seen: Set[str] = set()
    stable_passes = 0

    for _ in range(MAX_SCROLL_PASSES):
        current = _visible_pesels_from_rows(driver)
        before = len(seen)
        seen.update(current)

        if len(seen) == before:
            stable_passes += 1
        else:
            stable_passes = 0

        if stable_passes >= 5:
            break

        driver.execute_script("""
            const table = document.querySelector('table.table-dynamic');
            if (!table) { window.scrollBy(0, 900); return; }

            let el = table;
            for (let k=0; k<10; k++) {
              if (!el) break;
              const st = window.getComputedStyle(el);
              const oy = st.overflowY;
              if ((oy === 'auto' || oy === 'scroll') && el.scrollHeight > el.clientHeight) {
                el.scrollTop = el.scrollTop + Math.max(700, el.clientHeight * 0.9);
                return;
              }
              el = el.parentElement;
            }
            window.scrollBy(0, 900);
        """)
        time.sleep(0.6)

    return list(seen)


# =========================================================
# PARSERY HTML -> STRUKTURA DB
# =========================================================

def parse_osoba_and_zatrudnienie(html: str):
    soup = BeautifulSoup(html, "html.parser")
    lv = {}

    for tr in soup.select("div.viewer-body table tr"):
        tds = tr.find_all("td", recursive=False)
        if len(tds) == 2:
            k = tds[0].get_text(strip=True).rstrip(":")
            v = norm(tds[1].get_text(strip=True))
            lv[k] = v

    osoba = {
        "pesel": lv.get("PESEL"),
        "imie": lv.get("Imie"),
        "imie2": norm(lv.get("Drugie imie")),
        "nazwisko": lv.get("Nazwisko"),
        "numer_telefonu": norm(lv.get("Numer telefonu")),
        "data_zgonu": norm(lv.get("Data zgonu")),
        "nr_pwz": None,
        "typ_personelu_id": None
    }

    zatrudnienie = {
        "zatrudnienie_deklaracja": lv.get("Zatrudnienie/deklaracja zatrudnienia"),
        "zatrudniony_od": lv.get("Zatrudniony od"),
        "zatrudniony_do": None if lv.get("Zatrudniony do") == "BEZTERMINOWO" else lv.get("Zatrudniony do"),
        "srednioczasowy_czas_pracy": lv.get("Sr. miesieczny czas pracy godziny/minuty")
    }

    return osoba, zatrudnienie


def parse_uprawnienia(html: str):
    soup = BeautifulSoup(html, "html.parser")
    out = []
    for tr in soup.select("tr"):
        tds = [td.get_text(" ", strip=True) for td in tr.find_all("td")]
        if len(tds) >= 4 and tds[0].isupper():
            row_text = " ".join(tds)
            data_uzyskania = extract_after("Uzy", row_text)
            
            organ = None
            for td in tds[2:]:
                if "Nazwa:" in td:
                    organ = extract_name_after("Nazwa", td)
                    break
                elif "Izba" in td or "Okregowa" in td:
                    organ = td.strip()
                    break
            
            out.append({
                "rodzaj": tds[0],
                "npwz_id_rizh": tds[1],
                "organ_rejestrujacy": organ,
                "data_uzycia_uprawnienia": data_uzyskania
            })
    return out


def parse_zawody(html: str):
    soup = BeautifulSoup(html, "html.parser")
    out = []

    for tr in soup.select("tr"):
        tds = [td.get_text(" ", strip=True) for td in tr.find_all("td")]
        if len(tds) < 4:
            continue

        kod = (tds[0] or "").strip()
        if not kod.isdigit():
            continue

        nazwa = tds[1].strip() if len(tds) > 1 else None
        stopien = norm(tds[2]) if len(tds) > 2 else None

        data_cell = tds[3] if len(tds) > 3 else ""
        data_otw = extract_after("Otw", data_cell)
        data_uzy = extract_after("Uzy", data_cell)

        dyplom_raw = (tds[-1] or "").strip()
        if ("Otw:" in dyplom_raw) or ("Uzy:" in dyplom_raw) or dyplom_raw in ("", "-", "-"):
            dyplom = None
        else:
            dyplom = dyplom_raw

        out.append({
            "kod": kod,
            "nazwa": nazwa,
            "stopien_specjalizacji": stopien,
            "data_otwarcia_specjalizacji": data_otw,
            "data_uzyskania_specjalizacji": data_uzy,
            "dyplom": dyplom
        })

    return out


def parse_doswiadczenie(html: str):
    soup = BeautifulSoup(html, "html.parser")
    out = []
    for tr in soup.select("tr"):
        tds = [td.get_text(" ", strip=True) for td in tr.find_all("td")]
        if len(tds) == 3 and tds[0].isdigit():
            out.append({
                "kod": tds[0],
                "nazwa": tds[1],
                "zaswiadczenie": norm(tds[2])
            })
    return out


def parse_wyksztalcenie(html: str):
    soup = BeautifulSoup(html, "html.parser")
    out = []
    
    for tr in soup.select("tr"):
        tds = [td.get_text(" ", strip=True) for td in tr.find_all("td")]
        
        if len(tds) == 2:
            kod = tds[0].strip()
            nazwa = tds[1].strip()
            
            if re.match(r'^\d{4}$', kod) and nazwa and nazwa not in ("Nazwa", ""):
                out.append({
                    "rodzaj_wyksztalcenia": nazwa,
                    "kierunek": None,
                    "uczelnia": None,
                    "data_ukonczenia": None,
                    "dyplom": None
                })
    
    return out


# =========================================================
# MAIN
# =========================================================

def main():
    print(f"[INFO] Starting scraper (HEADLESS={HEADLESS}, IS_DOCKER={IS_DOCKER})")
    driver = create_driver()
    wait = WebDriverWait(driver, 35)

    try:
        login(driver)
        driver.get(PERSONNEL_URL)
        wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "table.table-dynamic")))

        pesels = collect_all_pesels_with_scroll(driver)
        pesels = sorted(set(pesels))

        print(f"[INFO] Zebrano {len(pesels)} PESELI (robust scan)")

        if LIMIT_EMPLOYEES:
            pesels = pesels[:LIMIT_EMPLOYEES]

        results = []

        for idx, pesel in enumerate(pesels, start=1):
            print(f"[INFO] {idx}/{len(pesels)}: {pesel}")

            ok = open_employee_preview_by_pesel(driver, pesel)
            if not ok:
                print(f"[WARN] Nie udalo sie otworzyc karty dla {pesel}")
                continue

            osoba, zatrudnienie = parse_osoba_and_zatrudnienie(driver.page_source)

            click_tab(driver, "zatprsmed_dane_upr_zaw")
            uprawnienia = parse_uprawnienia(driver.page_source)
            if uprawnienia:
                osoba["nr_pwz"] = uprawnienia[0]["npwz_id_rizh"]
                rodzaj = uprawnienia[0]["rodzaj"]
                osoba["typ_personelu_id"] = TYP_PERSONELU_MAP.get(_norm_key(rodzaj))

            click_tab(driver, "zatprsmed_dane_wykszt")
            wyksztalcenie = parse_wyksztalcenie(driver.page_source)

            click_tab(driver, "zatprsmed_dane_zaw_specj")
            zawody = parse_zawody(driver.page_source)

            click_tab(driver, "zatprsmed_dane_dos_zaw")
            dosw = parse_doswiadczenie(driver.page_source)

            results.append({
                "osoba": osoba,
                "zatrudnienie": zatrudnienie,
                "uprawnienia_zawodowe": uprawnienia,
                "wyksztalcenie": wyksztalcenie,
                "zawody_specjalnosci": zawody,
                "doswiadczenie_zawodowe": dosw
            })

            go_back_to_list(driver)

        Path(OUT_JSON).write_text(json.dumps(results, indent=2, ensure_ascii=False), encoding="utf-8")
        print(f"\n[OK] Zapisano {OUT_JSON} (rekordow: {len(results)})")

    finally:
        driver.quit()


if __name__ == "__main__":
    main()