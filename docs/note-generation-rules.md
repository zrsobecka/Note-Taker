# Note Generation Rules

These rules define how Obsidian Note Taker should turn copied text into Obsidian notes.

The goal is not to summarize text nicely.

The goal is to create a useful knowledge note that future me can understand, reuse, and connect with other notes.

## Core Principles

- Write in the same language as the source text.
- Do not copy the source text verbatim.
- Transform the source into practical understanding.
- Prefer clear mental models over long explanations.
- Use short paragraphs.
- Use bullets when they improve scanning.
- Use tables only when they make comparison or process clearer.
- Avoid academic tone.
- Avoid filler, motivational fluff, and generic advice.
- Keep only what will help future me think or act better.

## Obsidian Fit

- Use Markdown cleanly.
- Use one `#` title.
- Use `##` sections.
- Use `###` subsections only when they make the note easier to navigate.
- Add Obsidian wiki links for key concepts.
- Use specific links, not vague links.
- Prefer links like `[[HTTP]]`, `[[URL]]`, `[[Cookies]]`, `[[Headers]]`, `[[curl]]`.
- If the note belongs to a known knowledge area, use more specific links when obvious, for example `[[VC Decoder/Concepts/Investor Pipeline|Investor Pipeline]]`.
- Do not over-link every word.

## Default Structure

Use this structure unless the source text clearly needs a different shape:

```markdown
# {title}

## Główna idea

One clear idea in plain language.

## Co muszę zrozumieć

The core concepts, broken into small chunks.

## Jak o tym myśleć

Mental model, comparison, frame, or decision logic.

## Przydatne w praktyce

How to use this knowledge in real work.

## Najważniejsze wnioski

Short bullet list of what matters most.

## Powiązane pojęcia

- [[Key Concept]]
- [[Another Concept]]
```

## Optional Sections

Add these only when useful:

- `## Komendy` - when the source includes commands, CLI usage, code snippets, or technical steps.
- `## Proces` - when the source describes a workflow.
- `## Checklist` - when the note should guide repeated action.
- `## Przykład` - when one simple example makes the idea easier to remember.
- `## Pułapki` - when the source warns about mistakes or false assumptions.

## Style Inspired By VC Decoder

Good notes should feel like the VC Decoder notes:

- Start with the main idea, not background.
- Explain the difference between similar concepts.
- Translate theory into how someone thinks or acts.
- Use sections that teach the reader how to reason.
- End with a compact list of takeaways or related concepts.
- Make the note useful as a standalone object in Obsidian.

## Quality Bar

A good generated note should pass these checks:

- Can I understand the idea in 30 seconds?
- Can I reuse the note later without reopening the original source?
- Does it tell me how to think, not only what to remember?
- Are the links useful for navigating my vault?
- Is there anything generic that can be deleted?
