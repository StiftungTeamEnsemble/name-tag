# Example Badge Data

This folder contains ten sample entries for the photo badge layout.

Use the TSV with this format:

```bash
node ../src/cli.js example-badges.tsv \
  --format firstname,lastname,addition,image \
  --layout team-ensemble-badge-90x135 \
  --image-dir . \
  --output example-badges.pdf
```

Add `--sort lastname` if you want the output sorted alphabetically. Without
`--sort`, the entries are processed in the order shown in the TSV.

The image filenames in `example-badges.tsv` reference the portrait files in this
folder.

Portrait images are from [thispersondoesnotexist.com](https://thispersondoesnotexist.com/) and are used for demonstration purposes only.