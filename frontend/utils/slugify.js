export function slugify(text) {
    return text
      .toString() // Convert to string
      .toLowerCase() // Convert to lowercase
      .trim() // Remove leading/trailing whitespace
      .replace(/\s+/g, "-") // Replace spaces with hyphens
      .replace(/[^\w\-]+/g, "") // Remove all non-word characters
      .replace(/\-\-+/g, "-"); // Replace multiple hyphens with a single hyphen
  }