
export interface GATEPattern {
  subject: string;
  style: string;
  samples: string[];
}

export const GATE_KNOWLEDGE_BASE: GATEPattern[] = [
  {
    subject: "Data Structures and Algorithms",
    style: "Deep conceptual questions involving algorithm analysis, time complexity derivation, and step-by-step trace of data structure operations (Heaps, AVL Trees, Graphs, Hashing).",
    samples: [
      "Algorithm SUMsubarray(A[], n, Lower, Upper). Find output for specific inputs and time complexity. Propose efficient 'Alternatesum' algorithm.",
      "Convert the scoring rule formula '(A+B)^C+D/(E+F)*G+H/I' to postfix using a stack. Show step-by-step stack status.",
      "School canteen serving rule: Odd positions served first (priority), then even. Write pseudocode and trace for [S1..S6].",
      "Military squad sorting: Soldiers have engagement times. Repeatedly pick fastest remaining and place in order. Illustrate step-by-step.",
      "Nursery sapling arrangement (BST logic): Smaller ID left, Larger ID right. Insert 73, 45, 40, 90... Show in-order walk and search paths.",
      "Disaster response: Shortest path from relief camp A to others using weighted graph. Show tentative distance updates.",
      "Library Hash Table: Insert Book IDs 101, 112... into 15 slots using Quadratic Probing. Count probing attempts.",
      "Circular game: Participants in circular linked list. Pass ball k steps, eliminate node. Write pseudocode for creation, deletion, and simulation.",
      "Mineral processing: Priority values in Complete Binary Tree. Reorder for max-heap? Show rearrangement steps for [15, 70, 60...].",
      "Two algorithms trade-off: O(n^3)/O(1) vs O(n log n)/O(n). Analyze for memory-constrained devices.",
      "Analyze complexity of nested loops: i=1..n, j=n..1 (j/=2), k=1..i. Also Recurrence T(n)=2T(n/2)+4n.",
      "Convert expression 'A/(B^C)+(D+E)-(A*C)' to prefix using stack. Evaluate for A=4, B=2...",
      "Divide and Conquer strategy to find number 21 in sorted array. Count comparisons vs unsorted linear search.",
      "Compute diameter of a binary tree (longest path between leaf nodes). Pseudocode and trace.",
      "Broadcasting in hierarchical network (Binary Tree). Which traversal ensures level-by-level delivery?",
      "BST with Subtree Size: Algorithm to Insert(x), Delete(x), and return k-th largest in O(h).",
      "Campus navigation: Shortest path from Entrance A using Dijkstra. Handle ties lexicographically.",
      "Underground cable network: MST for 7 locations (A..Z) with costs. Minimize total cable length.",
      "Hash Table collisions: Separate chaining vs Linear Probing vs Quadratic Probing vs Double Hashing.",
      "Min-Heap Delivery Queue: [5, 10, 15...]. Simulate deletion of root and reheapification.",
      "Order_Book as AVL Tree: Insert prices [50, 20, 70...]. Show rotations (LL, LR, RR, RL). Delete nodes and rebalance.",
      "Recurrence T(n)=2T(n/2)+4n. Solve using recursion tree. What if branching factor becomes 4?",
      "Queue using Two Stacks: Enqueue on S1, Dequeue from S2. Trace operations. Write pseudocode.",
      "Reverse Singly Linked List: In-place reversal. Iterative vs Recursive pseudocode.",
      "Sort list elements only at indices divisible by k. Remaining elements stay fixed. Complexity analysis.",
      "Transform Binary Tree to Sum Tree. Calculate difference between sum of even and odd levels.",
      "Fiber-optic network MST. Update MST if specific direct connections (A-G, G-H) are mandatory.",
      "Double Hashing truck registration: h1(k) = k mod 11, h2(k) = 6 - (k mod 6). Insert keys 37, 48...",
      "Postfix to Expression Tree: '12 25 + 30 ...'. Construct tree, evaluate, and derive infix.",
      "Warehouse Inventory AVL: Insert/Delete Product IDs. Determine height and list leaf/internal nodes.",
      "Time complexity of loop: i=n/2..n, j=1..n, k=1..n (k*=2). Recurrence T(n)=2T(n-1)+1.",
      "SkyDrop ride: Fixed array queue cap 5. Service only if >=3 waiting. No shifting elements.",
      "Merge Sort on financial transactions. Explain Divide, Conquer, Merge steps and time complexity.",
      "Complete vs Perfect Binary Tree. Algorithm to check Completeness. Expression tree from Postfix.",
      "BST with Duplicates: Store (key, frequency). Decrement freq on delete. Trace insertions/deletions.",
      "Smart Township Power: Prim's algorithm for MST. Complexity dependence on V and E.",
      "Rehashing: Linear probing, load factor > 0.7 triggers resize. Trace insertions [120, 126...].",
      "Circular shift of Linear Linked List by k positions. Pseudocode.",
      "Doubly Linked List swap: Search KEY. If odd, swap with head. If even, swap with tail."
    ]
  },
  {
    subject: "Operating Systems",
    style: "Focus on process management, scheduling, deadlocks, and memory management. GATE style involves numerical problems on paging and scheduling.",
    samples: [
      "Calculate Average Turnaround Time for SJF, SRTF, and Round Robin scheduling.",
      "Banker's Algorithm: Check safe state and request granting for 5 processes and 3 resources.",
      "Page Replacement: Calculate page faults for FIFO, LRU, Optimal policies on reference string.",
      "Virtual Memory: Calculate Effective Access Time (EAT) given TLB hit ratio and access times.",
      "Synchronization: Semaphores and Mutex for Producer-Consumer or Readers-Writers problem."
    ]
  },
  {
    subject: "Computer Networks",
    style: "Emphasis on IP addressing, subnetting, TCP/IP protocols, and routing algorithms. Numerical problems on flow control and sliding window.",
    samples: [
      "Calculate subnets, broadcast address, and valid host range for a given CIDR block.",
      "Dijkstra's Link State routing: Compute forwarding table for a network graph.",
      "TCP Congestion Control: Calculate congestion window size after n rounds (Slow start/Congestion avoidance).",
      "Stop-and-Wait vs Go-Back-N: Calculate throughput and efficiency.",
      "CRC Calculation: Generate codeword for given data and polynomial."
    ]
  },
  {
    subject: "Database Management Systems",
    style: "Focus on Normalization, SQL queries, Transaction Serializability, and B/B+ Trees.",
    samples: [
      "Normalize a relation to 3NF/BCNF. Identify candidate keys and functional dependencies.",
      "Check conflict serializability of a given transaction schedule. Draw precedence graph.",
      "Construct B+ Tree of order p with given keys. Show split and merge operations.",
      "Write SQL queries involving Joins, Nested Subqueries, and Aggregation.",
      "ER to Relational Mapping: Convert ER diagram with weak entities and multi-valued attributes."
    ]
  },
  {
    subject: "Compiler Design",
    style: "Focus on Parsing (LL, LR), Syntax Directed Translation, and Code Optimization.",
    samples: [
      "Check if a grammar is LL(1), SLR(1), or CLR(1). Construct parsing tables.",
      "Compute FIRST and FOLLOW sets for a given grammar.",
      "Generate Three Address Code (TAC) for a given expression or code snippet.",
      "Optimize code using basic block analysis and DAG construction.",
      "Lexical Analysis: Construct DFA for a regular expression."
    ]
  },
  {
    subject: "Theory of Computation",
    style: "Automata theory, Regular expressions, Context-Free Grammars, and Turing Machines.",
    samples: [
      "Design DFA/NFA for a specific language (e.g., strings ending with 'abb').",
      "Convert Regular Expression to NFA and then to DFA.",
      "Pumping Lemma: Prove a language is not regular or not context-free.",
      "Design PDA for a Context-Free Language (e.g., a^n b^n).",
      "Turing Machine design for basic arithmetic or language recognition."
    ]
  },
  {
    subject: "Computer Architecture",
    style: "Instruction pipelining, Cache memory organization, and Addressing modes.",
    samples: [
      "Calculate speedup achieved by pipelining. Identify hazards (Data, Control, Structural).",
      "Direct vs Set-Associative Cache: Calculate tag bits, index bits, and offset.",
      "Floating point arithmetic (IEEE 754) calculations.",
      "Addressing Modes: Identify effective address calculation for given instructions."
    ]
  },
  {
    subject: "Digital System Design",
    style: "Boolean algebra, Combinational and Sequential circuits.",
    samples: [
      "Minimize Boolean expression using K-Map (SOP/POS).",
      "Design a counter (Synchronous/Asynchronous) for a specific sequence.",
      "Multiplexer based logic implementation.",
      "Finite State Machine (FSM): Draw state diagram and transition table."
    ]
  },
  {
    subject: "Software Engineering",
    style: "SDLC models, Testing, and Cost Estimation.",
    samples: [
      "COCOMO Model: Calculate effort and duration for a software project.",
      "Cyclomatic Complexity: Calculate for a given control flow graph.",
      "Testing: Generate test cases using Boundary Value Analysis or Equivalence Partitioning.",
      "Software Design Patterns: Identify appropriate pattern for a scenario."
    ]
  }
];

export function getGATEBlueprint(topic: string): string {
  const match = GATE_KNOWLEDGE_BASE.find(p => 
    topic.toLowerCase().includes(p.subject.toLowerCase()) || 
    p.subject.toLowerCase().includes(topic.toLowerCase())
  );
  
  if (match) {
    return `GATE PATTERN FOR ${match.subject}:
    Style: ${match.style}
    Reference Questions:
    ${match.samples.join('\n')}
    `;
  }
  
  return `GATE GENERAL STYLE: Conceptual depth, numerical precision, and application of theory. Focus on previous year patterns.`;
}
