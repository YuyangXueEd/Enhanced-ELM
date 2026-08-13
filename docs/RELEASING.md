# Releasing Enhanced ELM

GitHub Actions packages and publishes a GitHub Release whenever a version tag in the form `vX.Y.Z` is pushed. It uses the same [package-release.ps1](../scripts/package-release.ps1) script used for local store packages, so the ZIP has `manifest.json` at its root and includes only release-safe fonts and assets.

## Release checklist

1. Update `manifest.json` to the next `X.Y.Z` version.
2. Add a matching `## X.Y.Z` entry to [CHANGELOG.md](../CHANGELOG.md).
3. Run the local package check:

   ```powershell
   .\scripts\package-release.ps1 -Version X.Y.Z
   ```

4. Test the unpacked extension in the current ELM workspace at `https://elm.edina.ac.uk/elm`.
5. Commit the versioned source changes and push the branch.
6. Create and push the matching tag:

   ```powershell
   git tag vX.Y.Z
   git push origin vX.Y.Z
   ```

The workflow validates the tag, manifest, and changelog version before it creates `Enhanced-ELM-X.Y.Z.zip` and publishes it to GitHub Releases. If a workflow is re-run for an existing release, it replaces that release's ZIP asset but does not create a duplicate release.

## Manual workflow dispatch

In **Actions → Publish GitHub Release → Run workflow**, provide an existing tag such as `v0.1.2`. The workflow checks out that exact tag, rather than the branch selected in the Actions interface.

## Store publishing stays manual

GitHub Release automation does not submit an update to Chrome Web Store or Edge Add-ons. Upload the generated ZIP to each store after you have reviewed the GitHub Release asset and completed the respective store listing/review steps.
