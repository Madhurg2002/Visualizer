
export function* bubbleSort(array) {
  let arr = array.slice();
  const n = arr.length;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n - i - 1; j++) {
      yield { arr: arr.slice(), active: [j, j + 1] };
      if (arr[j] > arr[j + 1]) {
        [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
        yield { arr: arr.slice(), active: [j, j + 1] };
      }
    }
  }
  yield { arr: arr.slice(), active: [] };
}

export function* selectionSort(array) {
  let arr = array.slice();
  const n = arr.length;
  for (let i = 0; i < n - 1; i++) {
    let minIdx = i;
    for (let j = i + 1; j < n; j++) {
      yield { arr: arr.slice(), active: [j, minIdx] };
      if (arr[j] < arr[minIdx]) {
        minIdx = j;
      }
    }
    if (minIdx !== i) {
      [arr[i], arr[minIdx]] = [arr[minIdx], arr[i]];
      yield { arr: arr.slice(), active: [i, minIdx] };
    }
  }
  yield { arr: arr.slice(), active: [] };
}

export function* insertionSort(array) {
  let arr = array.slice();
  for (let i = 1; i < arr.length; i++) {
    let key = arr[i];
    let j = i - 1;
    while (j >= 0 && arr[j] > key) {
      yield { arr: arr.slice(), active: [j, j + 1] };
      arr[j + 1] = arr[j];
      j--;
      yield { arr: arr.slice(), active: [j + 1] };
    }
    arr[j + 1] = key;
    yield { arr: arr.slice(), active: [j + 1] };
  }
  yield { arr: arr.slice(), active: [] };
}

export function* quickSort(array) {
  let arr = array.slice();

  function* partition(low, high) {
    let pivot = arr[high];
    let i = low - 1;
    for (let j = low; j < high; j++) {
      yield { arr: arr.slice(), active: [j, high] };
      if (arr[j] < pivot) {
        i++;
        [arr[i], arr[j]] = [arr[j], arr[i]];
        yield { arr: arr.slice(), active: [i, j] };
      }
    }
    [arr[i + 1], arr[high]] = [arr[high], arr[i + 1]];
    yield { arr: arr.slice(), active: [i + 1, high] };
    return i + 1;
  }

  function* qs(low, high) {
    if (low < high) {
      const partGen = partition(low, high);
      let result = partGen.next();
      while (!result.done) {
        yield result.value;
        result = partGen.next();
      }
      let pi = result.value;
      yield* qs(low, pi - 1);
      yield* qs(pi + 1, high);
    }
  }

  yield* qs(0, arr.length - 1);
  yield { arr: arr.slice(), active: [] };
}

export function* mergeSort(array) {
  let arr = array.slice();

  function* merge(low, mid, high) {
    let left = arr.slice(low, mid + 1);
    let right = arr.slice(mid + 1, high + 1);
    let i = 0,
      j = 0,
      k = low;
    while (i < left.length && j < right.length) {
      yield { arr: arr.slice(), active: [k] };
      if (left[i] <= right[j]) {
        arr[k++] = left[i++];
      } else {
        arr[k++] = right[j++];
      }
    }
    while (i < left.length) arr[k++] = left[i++];
    while (j < right.length) arr[k++] = right[j++];
    yield { arr: arr.slice(), active: [] };
  }

  function* ms(low, high) {
    if (low < high) {
      let mid = Math.floor((low + high) / 2);
      yield* ms(low, mid);
      yield* ms(mid + 1, high);
      yield* merge(low, mid, high);
    }
  }

  yield* ms(0, arr.length - 1);
  yield { arr: arr.slice(), active: [] };
}

export function* heapSort(array) {
  let arr = array.slice();
  const n = arr.length;

  function* heapify(n, i) {
    let largest = i;
    let left = 2 * i + 1;
    let right = 2 * i + 2;

    if (left < n) {
      yield { arr: arr.slice(), active: [left, largest] };
      if (arr[left] > arr[largest]) {
        largest = left;
      }
    }

    if (right < n) {
      yield { arr: arr.slice(), active: [right, largest] };
      if (arr[right] > arr[largest]) {
        largest = right;
      }
    }

    if (largest !== i) {
      [arr[i], arr[largest]] = [arr[largest], arr[i]];
      yield { arr: arr.slice(), active: [i, largest] };
      yield* heapify(n, largest);
    }
  }

  for (let i = Math.floor(n / 2) - 1; i >= 0; i--) {
    yield* heapify(n, i);
  }

  for (let i = n - 1; i > 0; i--) {
    [arr[0], arr[i]] = [arr[i], arr[0]];
    yield { arr: arr.slice(), active: [0, i] };
    yield* heapify(i, 0);
  }
  yield { arr: arr.slice(), active: [] };
}

export function* shellSort(array) {
  let arr = array.slice();
  let n = arr.length;

  for (let gap = Math.floor(n / 2); gap > 0; gap = Math.floor(gap / 2)) {
    for (let i = gap; i < n; i += 1) {
      let temp = arr[i];
      let j;
      for (j = i; j >= gap && arr[j - gap] > temp; j -= gap) {
        yield { arr: arr.slice(), active: [j, j - gap] };
        arr[j] = arr[j - gap];
        yield { arr: arr.slice(), active: [j] };
      }
      arr[j] = temp;
      yield { arr: arr.slice(), active: [j] };
    }
  }
  yield { arr: arr.slice(), active: [] };
}

export const ALGORITHMS = {
  "Bubble Sort": bubbleSort,
  "Selection Sort": selectionSort,
  "Insertion Sort": insertionSort,
  "Quick Sort": quickSort,
  "Merge Sort": mergeSort,
  "Heap Sort": heapSort,
  "Shell Sort": shellSort,
};

export const ALGORITHM_OPTIONS = Object.keys(ALGORITHMS);

export const ALGORITHM_DESCRIPTIONS = {
  "Bubble Sort": "A simple comparison-based algorithm that repeatedly steps through the list, compares adjacent elements and swaps them if they are in the wrong order. complexity: O(n²)",
  "Selection Sort": "Divides the input list into two parts: a sorted sublist of items which is built up from left to right at the front (left) of the list and a sublist of the remaining unsorted items. Complexity: O(n²)",
  "Insertion Sort": "Builds the final sorted array (or list) one item at a time. It is much less efficient on large lists than more advanced algorithms such as quicksort, heapsort, or merge sort. Complexity: O(n²)",
  "Quick Sort": "An efficient, divide-and-conquer algorithm. It works by selecting a 'pivot' element from the array and partitioning the other elements into two sub-arrays, according to whether they are less than or greater than the pivot. Complexity: O(n log n)",
  "Merge Sort": "An efficient, stable, comparison-based, divide-and-conquer sorting algorithm. Most implementations produce a stable sort, meaning that the implementation preserves the input order of equal elements in the sorted output. Complexity: O(n log n)",
  "Heap Sort": "A comparison-based sorting technique based on a Binary Heap data structure. It is similar to selection sort where we first find the maximum element and place the maximum element at the end. Complexity: O(n log n)",
  "Shell Sort": "An in-place comparison sort. It can be seen as either a generalization of sorting by exchange (bubble sort) or sorting by insertion (insertion sort). The method starts by sorting pairs of elements far apart from each other, then progressively reducing the gap between elements to be compared. Complexity: O(n log n)",
};
