# Orent Spel

Ett touch-fokuserat HTML5-spel för fyra samtidiga spelare. Varje spelare har en egen färg och drar sitt färgmärkta skräp till rätt soptunna. Rätt sortering ger 10 poäng, fel sortering ger -4 poäng. En spelomgång tar en minut och avslutas med en resultatsida. Skräp som lämnas kvar försvinner efter 12 sekunder och ersätts automatiskt, så att alla alltid har saker att sortera.

## Starta lokalt

Starta servern från projektmappen:

```sh
node server.js
```

Öppna sedan `http://localhost:8000`. Servern lyssnar även på det lokala nätverket, så andra enheter kan öppna `http://<datorns-lan-ip>:8000`. För bästa upplevelse: använd en stor liggande multitouch-skärm i en modern webbläsare.

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

Håll kvar fingret på **ORENT SPEL** på startsidan i tre sekunder för att öppna inställningarna. Där går det att ändra speltid i sekunder, mängden skräp, hur snabbt skräp försvinner och ljud av/på. Varje skräpobjekt får en slumpad livstid inom ±25 % av det valda värdet. När ljud är på hörs tick de sista fem sekunderna, olika ljud för rätt/fel sortering och en fanfar på resultatsidan. Inställningarna sparas i [config/runtime-settings.json](config/runtime-settings.json) och läses av vid varje spelstart. Resultatsidan återgår automatiskt till startsidan efter en minut.

## Ändra regler

Redigera [config/game-config.json](config/game-config.json). Där finns spelarnas färger, soptunnor, objekttyper, poäng och hur många objekt som alltid ska finnas per spelare. Sortering är data-driven: ett objekt sorteras rätt när dess `categoryId` matchar soptunnans `id`.

## Publicera på GitHub

Git-repot är initierat. När du är redo:

```sh
git add .
git commit -m "Initial version of Orent Spel"
git branch -M main
git remote add origin <din-github-url>
git push -u origin main
```
