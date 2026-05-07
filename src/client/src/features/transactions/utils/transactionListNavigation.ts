export type TransactionNavigationAction = 'next' | 'previous'

const fullVisibilityTolerance = 2

export function scrollTransactionList(
  list: HTMLDivElement,
  cardSelector: string,
  action: TransactionNavigationAction,
) {
  const cards = Array.from(list.querySelectorAll<HTMLElement>(cardSelector))

  if (cards.length === 0) {
    return
  }

  const listRect = list.getBoundingClientRect()
  const cardRects = cards.map((card) => card.getBoundingClientRect())
  const fullyVisibleIndexes = cardRects
    .map((rect, index) => ({ index, rect }))
    .filter(({ rect }) => isFullyVisible(rect, listRect))
    .map(({ index }) => index)
  const fallbackVisibleIndex = findIntersectingIndex(cardRects, listRect)
  const visibleCount = Math.max(1, fullyVisibleIndexes.length)
  const firstFullyVisibleIndex = fullyVisibleIndexes[0] ?? fallbackVisibleIndex
  const lastFullyVisibleIndex = fullyVisibleIndexes.at(-1) ?? fallbackVisibleIndex
  const targetIndex = action === 'next'
    ? getNextTargetIndex(cardRects, listRect, firstFullyVisibleIndex, lastFullyVisibleIndex, visibleCount)
    : getPreviousTargetIndex(cardRects, listRect, firstFullyVisibleIndex, visibleCount)
  const targetCard = cards[targetIndex]

  if (!targetCard) {
    return
  }

  scrollTransactionCardIntoView(list, targetCard)
}

export function scrollTransactionCardIntoView(list: HTMLDivElement, card: HTMLElement) {
  const listRect = list.getBoundingClientRect()
  const cardRect = card.getBoundingClientRect()
  const isRtl = window.getComputedStyle(list).direction === 'rtl'
  const left = list.scrollLeft + (isRtl ? cardRect.right - listRect.right : cardRect.left - listRect.left)

  list.scrollTo({
    behavior: 'smooth',
    left,
  })
}

function getNextTargetIndex(
  cardRects: DOMRect[],
  listRect: DOMRect,
  firstFullyVisibleIndex: number,
  lastFullyVisibleIndex: number,
  visibleCount: number,
) {
  const adjacentIndex = lastFullyVisibleIndex + 1

  if (isPartiallyVisible(cardRects[adjacentIndex], listRect)) {
    return adjacentIndex
  }

  return Math.min(cardRects.length - 1, firstFullyVisibleIndex + visibleCount)
}

function getPreviousTargetIndex(
  cardRects: DOMRect[],
  listRect: DOMRect,
  firstFullyVisibleIndex: number,
  visibleCount: number,
) {
  const adjacentIndex = firstFullyVisibleIndex - 1

  if (isPartiallyVisible(cardRects[adjacentIndex], listRect)) {
    return adjacentIndex
  }

  return Math.max(0, firstFullyVisibleIndex - visibleCount)
}

function findIntersectingIndex(cardRects: DOMRect[], listRect: DOMRect) {
  const index = cardRects.findIndex((rect) => intersects(rect, listRect))

  return index >= 0 ? index : 0
}

function isFullyVisible(rect: DOMRect, listRect: DOMRect) {
  return (
    rect.left >= listRect.left - fullVisibilityTolerance &&
    rect.right <= listRect.right + fullVisibilityTolerance
  )
}

function isPartiallyVisible(rect: DOMRect | undefined, listRect: DOMRect) {
  return Boolean(rect && intersects(rect, listRect) && !isFullyVisible(rect, listRect))
}

function intersects(rect: DOMRect, listRect: DOMRect) {
  return (
    rect.right > listRect.left + fullVisibilityTolerance &&
    rect.left < listRect.right - fullVisibilityTolerance
  )
}
