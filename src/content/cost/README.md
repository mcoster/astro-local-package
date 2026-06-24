# Cost Content Collection

Cost entries hold estimate ranges and answer-first content for static cost pages.

Each entry must include:

- `last_reviewed`
- `assumptions`
- `service_area`
- `inclusions`
- `exclusions`
- `approved_by`
- `source_notes`

`approved_by` is internal governance metadata. Do not render it as a public credential.

Cost ranges must stay in visible HTML and must not be converted into structured price schema.
