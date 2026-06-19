# VC Decoder Knowledge Grid Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an additive Obsidian knowledge grid for `VC Decoder` with a main map, thematic maps, and concept notes, without deleting, moving, or rewriting existing lesson notes.

**Architecture:** Existing lesson notes remain the source material. New navigation files live in `VC Decoder/Maps/`, and new glossary-style concept files live in `VC Decoder/Concepts/`. Existing lessons may only receive a small appended navigation section if needed.

**Tech Stack:** Obsidian MCP server, Markdown, Obsidian wikilinks.

---

### Task 1: Inventory Existing Vault Content

**Files:**
- Read: `VC Decoder/*.md`
- Do not modify existing files in this task.

- [ ] **Step 1: List the `VC Decoder` folder through MCP**

Use `mcp__obsidian.vault_list` with:

```json
{"path":"VC Decoder"}
```

Expected: list of existing lesson files plus any folders already present.

- [ ] **Step 2: Check whether target files already exist**

Use `mcp__obsidian.vault_list` with:

```json
{"path":"VC Decoder/Maps"}
```

If the folder does not exist, note that it will be created by the first append if the MCP server supports parent directory creation. If not, create the folders using filesystem-safe tools inside the workspace only.

Use `mcp__obsidian.vault_list` with:

```json
{"path":"VC Decoder/Concepts"}
```

Expected: no accidental overwrite. If files already exist, read them before appending or skip creating duplicates.

### Task 2: Create Main Map

**Files:**
- Create: `VC Decoder/00 VC Decoder Map.md`

- [ ] **Step 1: Create the main map**

Use `mcp__obsidian.vault_append` to create `VC Decoder/00 VC Decoder Map.md` with sections:

```markdown
# VC Decoder Map

## Jak korzystac z tej mapy

Ta mapa jest punktem startowym do folderu `VC Decoder`. Lekcje sa materialem glownym, mapy pokazuja strukture, a concept notes tlumacza pojedyncze pojecia.

## Glowne obszary

- [[VC Decoder/Maps/Startup Logic Map|Startup Logic]]
- [[VC Decoder/Maps/Fund Math Map|Fund Math]]
- [[VC Decoder/Maps/Investor Thinking Map|Investor Thinking]]
- [[VC Decoder/Maps/Stage Map|Stage Map]]
- [[VC Decoder/Maps/Investment Case Map|Investment Case]]
- [[VC Decoder/Maps/Fundraising Materials Map|Fundraising Materials]]
- [[VC Decoder/Maps/Fundraising Process Map|Fundraising Process]]
- [[VC Decoder/Maps/Terms & Deal Structure Map|Terms & Deal Structure]]

## Najwazniejsze pojecia startowe

- [[VC Decoder/Concepts/Venture Scale|Venture Scale]]
- [[VC Decoder/Concepts/Power Law|Power Law]]
- [[VC Decoder/Concepts/Fund Returner|Fund Returner]]
- [[VC Decoder/Concepts/Stage Fit|Stage Fit]]
- [[VC Decoder/Concepts/Investment Case|Investment Case]]
- [[VC Decoder/Concepts/Dilution|Dilution]]
- [[VC Decoder/Concepts/Investor Pipeline|Investor Pipeline]]
- [[VC Decoder/Concepts/Term Sheet|Term Sheet]]
```

Expected: the main map exists and links to all thematic maps.

### Task 3: Create Thematic Maps

**Files:**
- Create: `VC Decoder/Maps/Startup Logic Map.md`
- Create: `VC Decoder/Maps/Fund Math Map.md`
- Create: `VC Decoder/Maps/Investor Thinking Map.md`
- Create: `VC Decoder/Maps/Stage Map.md`
- Create: `VC Decoder/Maps/Investment Case Map.md`
- Create: `VC Decoder/Maps/Fundraising Materials Map.md`
- Create: `VC Decoder/Maps/Fundraising Process Map.md`
- Create: `VC Decoder/Maps/Terms & Deal Structure Map.md`

- [ ] **Step 1: Create each map through MCP**

Each map must include:

```markdown
# [Map Name]

## O co chodzi

[Short practical explanation.]

## Lekcje

- [[VC Decoder/...|...]]

## Kluczowe pojecia

- [[VC Decoder/Concepts/...|...]]

## Kolejnosc nauki

1. ...
2. ...
3. ...

## Jesli nie rozumiesz

- Jesli nie rozumiesz `[concept]`, wroc do [[VC Decoder/...|...]].
```

Expected: eight thematic maps exist, each linking to real lessons and relevant concept notes.

### Task 4: Create First Concept Notes

**Files:**
- Create concept notes under `VC Decoder/Concepts/`.

- [ ] **Step 1: Create priority concept notes**

Create concept notes for:

```text
ARR
Angel Investor
Bootstrapping
Cap Table
Carry
Category Winner
Check Size
Data Room
Dilution
Due Diligence
Evidence Gap
Evidence Ladder
Exit
Follow-On
Founder-Market Fit
Fund Clock
Fund Math
Fund Returner
Fund Size
Fundraising
GTM
GP
Investment Case
Investor Pipeline
Lead Investor
Liquidation Preference
LP
Management Fee
Milestone Plan
MOIC
Network Effects
Option Pool
Outlier
Ownership
Power Law
Pre-Seed
Product Market Fit
Pro-Rata
Runway
SAFE
Seed
Series A
Stage Fit
TAM
Term Sheet
Traction
Valuation
VC-Backability
Venture Scale
Wedge
```

Each concept note must use:

```markdown
# [Concept]

## Co to znaczy

[Simple definition.]

## Dlaczego wazne w VC

[Why this matters in startup fundraising.]

## Jak inwestor na to patrzy

[Investor interpretation.]

## Prosty przyklad

[Concrete example.]

## Powiazane lekcje

- [[VC Decoder/...|...]]

## Powiazane pojecia

- [[VC Decoder/Concepts/...|...]]
```

Expected: priority concept notes exist and are short, practical, and linked.

### Task 5: Append Minimal Navigation To Existing Lessons

**Files:**
- Modify existing `VC Decoder/*.md` only by appending a small section at the end.

- [ ] **Step 1: Append navigation only where useful**

For each existing lesson, append:

```markdown

---

# Nawigacja

## Mapa tematyczna

- [[VC Decoder/Maps/...|...]]

## Kluczowe concept notes

- [[VC Decoder/Concepts/...|...]]
```

Expected: original lesson content remains intact, and only a small navigation block is added at the end.

### Task 6: Verify The Grid

**Files:**
- Read: `VC Decoder/00 VC Decoder Map.md`
- Read: `VC Decoder/Maps/*.md`
- Read selected `VC Decoder/Concepts/*.md`

- [ ] **Step 1: Verify folders and files**

Use `mcp__obsidian.vault_list` with:

```json
{"path":"VC Decoder"}
```

Expected: `00 VC Decoder Map.md`, `Maps/`, and `Concepts/` are visible.

- [ ] **Step 2: Verify map folders**

Use `mcp__obsidian.vault_list` with:

```json
{"path":"VC Decoder/Maps"}
```

Expected: eight thematic map files.

- [ ] **Step 3: Verify concept folder**

Use `mcp__obsidian.vault_list` with:

```json
{"path":"VC Decoder/Concepts"}
```

Expected: priority concept notes exist.

- [ ] **Step 4: Spot-check content**

Read:

```text
VC Decoder/00 VC Decoder Map.md
VC Decoder/Maps/Fund Math Map.md
VC Decoder/Maps/Fundraising Process Map.md
VC Decoder/Concepts/Power Law.md
VC Decoder/Concepts/Dilution.md
VC Decoder/Concepts/Term Sheet.md
```

Expected: content is useful, links are readable, and existing lessons were not overwritten.
