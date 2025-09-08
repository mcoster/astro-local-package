# Data Directory

This directory is intentionally empty in the npm package.

## Location Data

The location data (suburbs.json) should be provided by the consuming project at:
`src/data/suburbs.json`

This makes the package location-agnostic and allows it to work with any city or region.

## Expected Structure

The consuming project's `src/data/suburbs.json` should have this structure:

```json
{
  "generated": "2025-01-09T00:00:00.000Z",
  "center": {
    "lat": -28.003,
    "lng": 153.410
  },
  "suburbs": [
    {
      "id": 1,
      "name": "Suburb Name",
      "postcode": "4000",
      "state": "QLD",
      "latitude": -27.123,
      "longitude": 153.456,
      "distanceKm": 5.2,
      "direction": "N"
    }
  ]
}
```

## Generating Location Data

Projects should use the `export-suburbs.ts` script to generate their location data from PostGIS or another data source.