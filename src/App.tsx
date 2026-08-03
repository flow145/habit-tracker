import { useState } from 'react'

export const App = () => {
  const [count, setCount] = useState(0)

  return (
    <>
      <h1>Habit tracker</h1>
      <button type='button' onClick={() => setCount((value) => value + 1)}>
        Count is {count}
      </button>
    </>
  )
}
