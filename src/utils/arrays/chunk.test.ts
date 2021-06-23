import chunk from './chunk'

test('Returns the array contents parsed in the correct number of chunks', ()=> {
    const chunks = chunk([1,2,3,4,5,6,7,8,9], 2)
    expect(chunks).toEqual([[1,2],[3,4],[5,6],[7,8],[9]])
})