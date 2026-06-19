# VC Decoder Knowledge Grid Design

## Cel

Zbudowac dodatkowa warstwe nawigacji dla folderu Obsidiana `VC Decoder`, bez usuwania ani przepisywania istniejacych lekcji.

Efekt ma pomoc w:

- szybkim przechodzeniu od lekcji do pojec;
- rozumieniu, jak koncepty startupowe, VC i fundraisingowe lacza sie ze soba;
- znajdowaniu miejsc, gdzie dane pojecie pojawia sie w kursie;
- uczeniu sie tematow po kolei przez mapy tematyczne.

## Zakres

Powstana nowe pliki w vault Obsidiana:

- `VC Decoder/00 VC Decoder Map.md`
- `VC Decoder/Maps/*.md`
- `VC Decoder/Concepts/*.md`

Istniejace lekcje zostaja zachowane. Dopuszczalna zmiana w istniejacych lekcjach to tylko dodanie na koncu malej sekcji nawigacyjnej, np. `Powiazane mapy` lub uzupelnienie linkow do nowych concept notes.

## Struktura map

Glowna mapa `00 VC Decoder Map.md` bedzie punktem startowym. Bedzie grupowac kurs w osiem obszarow:

- Startup Logic
- Fund Math
- Investor Thinking
- Stage Map
- Investment Case
- Fundraising Materials
- Fundraising Process
- Terms & Deal Structure

Folder `VC Decoder/Maps/` bedzie zawieral mapy tematyczne:

- `Startup Logic Map.md`
- `Fund Math Map.md`
- `Investor Thinking Map.md`
- `Stage Map.md`
- `Investment Case Map.md`
- `Fundraising Materials Map.md`
- `Fundraising Process Map.md`
- `Terms & Deal Structure Map.md`

Kazda mapa bedzie miec:

- krotki opis obszaru;
- linki do najwazniejszych lekcji;
- linki do kluczowych pojec;
- sugerowana kolejnosc nauki;
- sekcje `Jesli nie rozumiesz X, wroc do Y`.

## Struktura concept notes

Folder `VC Decoder/Concepts/` bedzie zawieral osobne notatki dla waznych pojec, np. `Power Law`, `TAM`, `Dilution`, `Fund Returner`, `SAFE`, `Founder-Market Fit`, `Data Room`, `Due Diligence`.

Kazda notatka pojecia bedzie miec stala strukture:

- `Co to znaczy`
- `Dlaczego wazne w VC`
- `Jak inwestor na to patrzy`
- `Prosty przyklad`
- `Powiazane lekcje`
- `Powiazane pojecia`

Notatki pojec maja byc krotkie i praktyczne. Nie maja zastapic lekcji, tylko tlumaczyc termin i laczyc go z innymi miejscami.

## Zasady bezpieczenstwa

- Nie usuwac istniejacych notatek.
- Nie przenosic istniejacych notatek.
- Nie przepisywac lekcji od zera.
- Nowa struktura ma byc dodatkiem.
- Jesli istnieje plik o tej samej nazwie, nie nadpisywac go bez sprawdzenia.
- Linki maja byc uzyteczne, nie masowe. Lepiej mniej dobrych polaczen niz duzo przypadkowych.

## Implementacja przez MCP

Praca bedzie wykonana przez serwer MCP Obsidiana:

- listowanie folderu `VC Decoder`;
- czytanie istniejacych lekcji;
- tworzenie nowych map i concept notes;
- dodawanie minimalnych sekcji nawigacyjnych na koncu lekcji, jesli bedzie to potrzebne.

Jezeli narzedzie MCP pozwala tylko dopisywac tresc, zmiany w istniejacych lekcjach beda ograniczone do bezpiecznego appendowania nowych sekcji na koncu.

## Weryfikacja

Po wdrozeniu trzeba sprawdzic:

- czy powstaly foldery `Maps` i `Concepts`;
- czy glowna mapa linkuje do map tematycznych;
- czy mapy tematyczne linkuja do lekcji i pojec;
- czy concept notes maja spojna strukture;
- czy istniejace lekcje nadal zawieraja oryginalna tresc;
- czy nie powstaly oczywiste duplikaty linkow.

## Poza zakresem

Na tym etapie nie tworzymy:

- automatycznego pluginu do Obsidiana;
- pelnego systemu tagow dla calego vaulta;
- przebudowy nazw istniejacych lekcji;
- streszczen wszystkich lekcji od zera.
