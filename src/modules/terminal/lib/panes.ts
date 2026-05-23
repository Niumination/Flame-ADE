export type PaneId = number

export type SplitDir = "row" | "col"

export type PaneNode =
  | { kind: "leaf"; id: PaneId; cwd?: string }
  | {
      kind: "split"
      id: PaneId
      dir: SplitDir
      children: PaneNode[]
    }

export function isLeaf(n: PaneNode): n is Extract<PaneNode, { kind: "leaf" }> {
  return n.kind === "leaf"
}

export function leafIds(n: PaneNode): PaneId[] {
  if (isLeaf(n)) return [n.id]
  return n.children.flatMap(leafIds)
}

export function findLeafCwd(n: PaneNode, id: PaneId): string | undefined {
  if (isLeaf(n)) return n.id === id ? n.cwd : undefined
  for (const c of n.children) {
    const found = findLeafCwd(c, id)
    if (found !== undefined) return found
  }
  return undefined
}

export function hasLeaf(tree: PaneNode, id: PaneId): boolean {
  return leafIds(tree).includes(id)
}
