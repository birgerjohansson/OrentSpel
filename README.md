# Orent Spel

Ett touch-fokuserat HTML5-spel för en till fyra samtidiga spelare. Spelarna väljer antal deltagare, får varsin färg och samarbetar om en gemensam poäng. Rätt sortering ger 10 poäng och fel sortering ger -4 poäng.

Kampanjen består av sju nivåer. Den första har två avfallskategorier och lugnt tempo. Varje ny nivå lägger till en kategori, visar mer skräp och låter skräpet försvinna snabbare. Lagets poängmål anpassas efter antalet spelare. När målet nås går laget vidare direkt; tar tiden slut kan nivån spelas om.

## Starta lokalt

Starta servern från projektmappen:

```sh
node server.js
```

Öppna sedan `http://localhost:8000`. Servern lyssnar även på det lokala nätverket, så andra enheter kan öppna `http://<datorns-lan-ip>:8000`. För bästa upplevelse: använd en stor liggande multitouch-skärm i en modern webbläsare.

Spelet kan också laddas upp till ren statisk hosting, exempelvis GitHub Pages eller ett vanligt webbhotell. Då används [config/runtime-settings.json](config/runtime-settings.json) som standard och spelinställningar sparas lokalt i den aktuella webbläsaren.

## Offline-läge

Efter att spelet har öppnats en gång cachar en service worker spelkoden, bilderna och de senast hämtade inställningarna. Spelet kan då starta och spelas även om anslutningen till servern tillfälligt försvinner.

Service workers kräver en säker anslutning. Det fungerar automatiskt på `localhost`; för TV:n via en LAN-adress behövs **HTTPS** (eller en webbläsare/installation som uttryckligen tillåter lokalt HTTP) för att offline-läget ska kunna aktiveras.

## Struktur

```
animations/       Visuella animationer
audio/            Ljudhantering och plats för framtida ljudfiler
config/           JSON-regler, spelare, kategorier och poäng
js/audio/         Web Audio-effekter
js/logic/         Spelregler, tillstånd, skapande av skräp och styrning
js/ui/            DOM-rendering
Resources/        Tillhandahållna bildresurser
```

## Dolda spelinställningar

Håll kvar fingret på **ORENT SPEL** på startsidan i tre sekunder för att öppna inställningarna. Där går det att välja svårighetsgrad, ändra storleken på skräp och tunnor, slå av eller på ljud samt återställa statistiken. Svårighetsgraden påverkar nivåernas poängmål, tid och hur länge skräpet ligger kvar. Varje skräpobjekt får dessutom en slumpad livstid inom ±25 % av nivåns värde. När ljud är på hörs tick de sista fem sekunderna, olika ljud för rätt/fel sortering och en fanfar när en nivå klaras. Vid statisk hosting sparas ändringarna lokalt i webbläsaren; med `server.js` sparas de även i [config/runtime-settings.json](config/runtime-settings.json). Slut- och misslyckandeskärmar återgår automatiskt till startsidan efter en minut.

## Ändra regler

Redigera [config/game-config.json](config/game-config.json) för spelarnas färger, soptunnor, objekttyper och poäng. Nivåernas kategorier, tid, skräpmängd, livstid och grundmål finns i [config/levels.json](config/levels.json). Sortering och nivåer är data-drivna, så reglerna kan ändras utan att spelkoden skrivs om.

## Publicera på GitHub

Git-repot är initierat. När du är redo:

```sh
git add .
git commit -m "Initial version of Orent Spel"
git branch -M main
git remote add origin <din-github-url>
git push -u origin main
```
