# Orent Spel

Ett touch-fokuserat HTML5-spel för fyra samtidiga spelare. Varje spelare har en egen färg och drar sitt färgmärkta skräp till rätt soptunna. Rätt sortering ger 10 poäng, fel sortering ger -4 poäng. En spelomgång tar två minuter och avslutas med en resultatsida. Skräp som lämnas kvar försvinner efter 12 sekunder och ersätts automatiskt, så att alla alltid har saker att sortera.

## Starta lokalt

Projektet består av rena statiska filer och använder ES-moduler, så kör det via en enkel lokal webbserver från projektmappen:

```sh
python3 -m http.server 8000
```

Öppna sedan `http://localhost:8000`. För bästa upplevelse: använd en stor liggande multitouch-skärm i en modern webbläsare.

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
