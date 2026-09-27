// A heading's anchor: lower case, runs of anything else become one hyphen. Shared by the MDX heading renderer and
// the section index, so a link always matches its target.
export const anchor = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
