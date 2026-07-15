type TtsFileRecord = {
  size?: unknown
  url?: unknown
}

type TtsAssetWithFile = {
  file?: TtsFileRecord | null
  status?: unknown
}

export function getReadyFileUrl(
  asset: TtsAssetWithFile | null | undefined,
): string | null {
  if (!asset || asset.status !== "ready" || !asset.file) {
    return null
  }

  const { file } = asset

  if (
    typeof file.url !== "string" ||
    (typeof file.size === "number" && file.size <= 0)
  ) {
    return null
  }

  return file.url
}
