## Packages
date-fns | Formatting dates for display
recharts | Dashboard analytics charts and data visualization

## Notes
Tailwind Config - extend fontFamily:
fontFamily: {
  sans: ["var(--font-sans)"],
  display: ["var(--font-display)"],
}

Assumption: Dates returned from the API are ISO strings and will be coerced to Date objects on the frontend using `z.coerce.date()`. 
Assumption: Property `imageUrl` can be a URL string. If empty, we will display a placeholder.
