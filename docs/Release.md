# How to release

This is documenting the release process.

We're using [calendar versioning](https://calver.org/) where `YYYY.MM.DD` should be set accordingly.

```sh
VERSION=YYYY.MM.DD
```

## Update package.json and tag

Update the [package.json](../package.json) `version` to match the new release version.

```sh
sed --regexp-extended 's/"version": "(.+)"/"version": "'$VERSION'"/' --in-place package.json
```

Then commit and tag:

```sh
git commit -a -m ":bookmark: $VERSION"
git tag -a $VERSION -m ":bookmark: $VERSION"
```

Push everything including tags:

```sh
git push
git push --tags
```

## Publish to npm

Publication to npm happens automatically from GitHub Actions on tag push.
Alternatively it can be done manually via:

```sh
yarn build
npm publish
```
