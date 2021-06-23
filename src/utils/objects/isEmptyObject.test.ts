import isEmptyObject from './isEmptyObject'

test('Returns true if argument is empty object literal, otherwise false', () => {
    expect(isEmptyObject({})).toBeTruthy
    expect(isEmptyObject({dogs:3})).toBeFalsy
    expect(isEmptyObject([])).toBeFalsy
})