// Priority Queue implementation using max heap
export class PriorityQueue {
  constructor() {
    this.items = []
  }

  // Add element to the queue with priority
  enqueue(element, priority) {
    const queueElement = { element, priority }
    this.items.push(queueElement)
    this.heapifyUp(this.items.length - 1)
  }

  // Remove and return the highest priority element
  dequeue() {
    if (this.isEmpty()) {
      return null
    }

    const top = this.items[0]
    const bottom = this.items.pop()

    if (this.items.length > 0) {
      this.items[0] = bottom
      this.heapifyDown(0)
    }

    return top
  }

  // Check if queue is empty
  isEmpty() {
    return this.items.length === 0
  }

  // Get size of queue
  size() {
    return this.items.length
  }

  // Heapify up (for insertion)
  heapifyUp(index) {
    let currentIndex = index

    while (currentIndex > 0) {
      const parentIndex = Math.floor((currentIndex - 1) / 2)

      // If current priority is greater than parent, swap
      if (this.items[currentIndex].priority > this.items[parentIndex].priority) {
        this.swap(currentIndex, parentIndex)
        currentIndex = parentIndex
      } else {
        break
      }
    }
  }

  // Heapify down (for deletion)
  heapifyDown(index) {
    let currentIndex = index
    const length = this.items.length

    while (true) {
      const leftChildIndex = 2 * currentIndex + 1
      const rightChildIndex = 2 * currentIndex + 2
      let largestIndex = currentIndex

      // Compare with left child
      if (leftChildIndex < length && this.items[leftChildIndex].priority > this.items[largestIndex].priority) {
        largestIndex = leftChildIndex
      }

      // Compare with right child
      if (rightChildIndex < length && this.items[rightChildIndex].priority > this.items[largestIndex].priority) {
        largestIndex = rightChildIndex
      }

      // If largest is not current, swap and continue
      if (largestIndex !== currentIndex) {
        this.swap(currentIndex, largestIndex)
        currentIndex = largestIndex
      } else {
        break
      }
    }
  }

  // Swap elements at two indices
  swap(i, j) {
    ;[this.items[i], this.items[j]] = [this.items[j], this.items[i]]
  }
}

