# 算法与数据结构学习指南 (TypeScript 版)

欢迎开启算法学习之旅！作为新手，建议遵循“先基础后进阶、先数据结构后算法”的原则。以下是为您推荐的学习顺序。

## 1. 学习路线图

### 第一阶段：基础数据结构
这是所有算法的基石，务必掌握其底层原理与 TypeScript 实现。
1.  **数组与链表 (Array & Linked List)**
    *   掌握数组的内存布局。
    *   实现单向链表与双向链表。
2.  **栈与队列 (Stack & Queue)**
    *   理解后进先出 (LIFO) 与先进先出 (FIFO)。
    *   使用数组或链表模拟实现。
3.  **哈希表 (Hash Table / Map)**
    *   理解哈希冲突及解决方法。
    *   在 TS 中熟练使用 `Map` 和 `Set`。

### 第二阶段：基础算法思维
1.  **时间与空间复杂度分析 (Big O Notation)**
    *   **核心：** 能够分析代码的运行效率。
2.  **递归 (Recursion)**
    *   理解递归基准条件 (Base Case)。
3.  **排序算法 (Sorting)**
    *   基础：冒泡、插入、选择排序。
    *   进阶：归并排序、快速排序（重点）。

### 第三阶段：树与图
1.  **二叉树 (Binary Tree)**
    *   前/中/后序遍历、层序遍历。
    *   二叉搜索树 (BST) 的增删改查。
2.  **堆 (Heap)**
    *   最大堆、最小堆的实现。
    *   优先队列的应用。
3.  **图 (Graph)**
    *   邻接矩阵与邻接表。
    *   广度优先搜索 (BFS) 与深度优先搜索 (DFS)。

### 第四阶段：高阶算法
1.  **二分查找 (Binary Search)**
2.  **双指针与滑动窗口 (Two Pointers & Sliding Window)**
3.  **分治法 (Divide and Conquer)**
4.  **动态规划 (Dynamic Programming)**
5.  **贪心算法 (Greedy)**

---

## 2. 建议练习方式

1.  **动手实现：** 在 `__dev__\ts_algorithms` 目录下，为每个知识点创建一个 `.ts` 文件，手动编写其数据结构或算法。
2.  **代码示例规范：**
    ```typescript
    /**
     * 範例：簡單的二分查找
     * @param arr 排序好的數組
     * @param target 目標值
     */
    function binarySearch(arr: number[], target: number): number {
      let left = 0;
      let right = arr.length - 1;

      while (left <= right) {
        // 防止溢位
        const mid = Math.floor(left + (right - left) / 2);

        if (arr[mid] === target) return mid;
        if (arr[mid] < target) left = mid + 1;
        else right = mid - 1;
      }

      return -1;
    }
    ```

## 3. 推荐资源

*   **LeetCode：** 基础打好后，按标签刷题。
*   **可视化网站：** VisuAlgo 或 Algorithm Visualizer。
*   **书籍：** 《算法图解》(Grokking Algorithms) —— 非常适合新手入门。

祝你学习顺利！
