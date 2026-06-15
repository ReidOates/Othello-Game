export const sampleTree = {
  id: 'root',
  type: 'MAX',
  score: 10,
  isBest: true,
  move: null,
  children: [
    {
      id: 'node_1',
      type: 'MIN',
      score: 10,
      isBest: true,
      move: { row: 2, col: 3, flips: [] },
      children: [
        {
          id: 'node_3',
          type: 'LEAF',
          score: 10,
          isBest: true,
          move: { row: 3, col: 2, flips: [] },
          children: []
        },
        {
          id: 'node_4',
          type: 'LEAF',
          score: 5,
          isBest: false,
          move: { row: 4, col: 5, flips: [] },
          children: []
        }
      ]
    },
    {
      id: 'node_2',
      type: 'MIN',
      score: -15,
      isBest: false,
      isPruned: true,
      move: { row: 5, col: 4, flips: [] },
      children: []
    }
  ]
};

export default { sampleTree };
