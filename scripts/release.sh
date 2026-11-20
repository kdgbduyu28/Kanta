#!/usr/bin/env bash
#
# Release Kanta (Android only, no web build).
#
#   ./scripts/release.sh --apk               # tag + push; GitHub builds the APK into Releases
#   ./scripts/release.sh --apk=v1.2.0        # same, with an explicit version (default: app.json)
#
# Same flow as Pabili's --apk path. The APK is built by .github/workflows/android-release.yml.

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
APK_TAG=

case "${1:-}" in
  --apk) ;;
  --apk=*) APK_TAG="${1#--apk=}" ;;
  -h|--help|"") sed -n '3,9p' "$0"; exit 0 ;;
  *) echo "release.sh: unknown option '$1'" >&2; exit 2 ;;
esac

cd "$ROOT"
tag="$APK_TAG"
[[ -n "$tag" ]] || tag="v$(node -p 'require("./app.json").expo.version')"
[[ "$tag" == v* ]] || tag="v$tag"
if ! git remote get-url origin >/dev/null 2>&1; then
  echo "release.sh: no GitHub remote yet; create the repo and push it first" >&2
  exit 1
fi
if [[ -n "$(git status --porcelain --untracked-files=no)" ]]; then
  echo "release.sh: commit your changes first; the APK is built from GitHub, not this folder" >&2
  exit 1
fi
git fetch --quiet origin
if ! git merge-base --is-ancestor HEAD '@{u}' 2>/dev/null; then
  echo "release.sh: push this branch first (git push); the APK is built from GitHub" >&2
  exit 1
fi
if git rev-parse --quiet --verify "refs/tags/$tag" >/dev/null \
    || git ls-remote --exit-code --tags origin "refs/tags/$tag" >/dev/null; then
  echo "release.sh: $tag already exists; bump the version or pass --apk=vX.Y.Z" >&2
  exit 1
fi
git tag -a "$tag" -m "$tag"
git push --quiet origin "refs/tags/$tag"
repo="$(git remote get-url origin | sed -E 's#^(git@github\.com:|https://github\.com/)##; s#\.git$##')"
echo "Tagged $tag; GitHub Actions is building the APK (15-25 min):"
echo "  progress: https://github.com/$repo/actions/workflows/android-release.yml"
echo "  download: https://github.com/$repo/releases/tag/$tag"
