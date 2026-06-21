# MTF Trader — návod na nasazení (GitHub Pages + PWA)

Tahle appka po nasazení funguje jako instalovatelná appka na Androidu (i iPhone) — s ikonou na ploše, bez adresního řádku, offline cache.

---

## 1. Vlož svůj API klíč

Otevři `index.html`, najdi řádek (je hned v `<script>` sekci):

```js
const API_KEY = 'VLOZ_SVUJ_API_KLIC';
```

Nahraď za svůj reálný Twelve Data klíč:

```js
const API_KEY = 'tvuj-skutecny-klic-zde';
```

**Důležité:** Tento klíč bude veřejně viditelný v HTML zdrojovém kódu na GitHubu (pokud repozitář necháš public). Pro osobní demo použití je to v pořádku, ale:
- Twelve Data free klíč nemá citlivá oprávnění (jen čtení trh. dat)
- Pokud chceš klíč skrýt, řešením je vlastní proxy server — pro tento účel to ale není nutné

---

## 2. Vytvoř GitHub repozitář

1. Jdi na [github.com](https://github.com) a přihlas se (nebo si vytvoř účet)
2. Klikni vpravo nahoře na **+** → **New repository**
3. Název repozitáře např. `mtf-trader`
4. Zvol **Public**
5. **NEZAŠKRTÁVEJ** "Add a README file" (už ho máme)
6. Klikni **Create repository**

---

## 3. Nahraj soubory

Na stránce nového repozitáře:

1. Klikni na **uploading an existing file** (nebo `Add file` → `Upload files`)
2. Přetáhni VŠECHNY tyto soubory najednou:
   - `index.html`
   - `manifest.json`
   - `sw.js`
   - `icon-192.png`
   - `icon-512.png`
3. Dole napiš commit zprávu, např. "Initial upload"
4. Klikni **Commit changes**

---

## 4. Zapni GitHub Pages

1. V repozitáři klikni na **Settings** (nahoře v menu)
2. V levém menu klikni na **Pages**
3. Pod **Source** vyber **Deploy from a branch**
4. Branch: vyber **main**, folder: **/ (root)**
5. Klikni **Save**
6. Počkej 1–2 minuty, stránka se obnoví a zobrazí URL typu:
   ```
   https://tvoje-jmeno.github.io/mtf-trader/
   ```

---

## 5. Nainstaluj na Android telefon

1. Otevři tu URL v **Chromu** na mobilu
2. Mělo by se objevit vyskakovací okno **"Přidat na plochu"** / **"Install app"**
   - Pokud se neobjeví automaticky: klikni na ⋮ (tři tečky vpravo nahoře) → **Přidat na plochu** / **Nainstalovat aplikaci**
3. Potvrď — na ploše telefonu se objeví ikona MTF Trader
4. Klikni na ni — appka se otevře na celou obrazovku, bez adresního řádku, jako nativní app

---

## 6. Aktualizace appky v budoucnu

Když chceš appku upravit:

1. V GitHub repozitáři otevři `index.html`
2. Klikni na ikonu tužky (Edit)
3. Uprav kód
4. Dole klikni **Commit changes**
5. Za ~1 minutu se změna projeví na živé URL
6. V appce na mobilu by se měla aktualizace stáhnout automaticky (service worker), nebo appku zavři a znovu otevři

---

## Poznámky

- **Data se ukládají lokálně** v telefonu (localStorage) — pozice a journal zůstanou i po zavření appky, ale jsou vázané na konkrétní telefon/prohlížeč. Pro zálohu používej Export PDF/CSV.
- **API limit**: Twelve Data free plán = 800 requestů/den, 8/minutu. Scanner dělá sekvenční volání s prodlevou, takže by to měl zvládnout.
- **Offline**: appka se po prvním načtení nainstaluje do cache, takže se otevře i bez internetu — ale živá data (scanner, ceny) samozřejmě potřebují připojení.
