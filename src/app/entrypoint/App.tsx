import { Form } from '@base-ui/react/form'
import { useState } from 'react'
import { Route, Switch } from 'wouter'

import { Home } from '~/pages/home'
import { Button } from '~/shared/components/Button'
import { Schedule } from '~/shared/components/Schedule'
import { ThemeSynchronizer } from '../theme'

const Playground = () => {
  const [submittedValues, setSubmittedValues] = useState<unknown>(null)

  return (
    <main style={{ display: 'grid', gap: '24px', justifyContent: 'start', padding: '24px' }}>
      <h1>Playground</h1>
      <Form
        style={{ display: 'grid', gap: '24px', justifyContent: 'start' }}
        onFormSubmit={(values) => setSubmittedValues(values)}
      >
        <Schedule />
        <Button type='submit'>Submit</Button>
      </Form>
      <pre>
        {submittedValues === null ? 'Not submitted yet' : JSON.stringify(submittedValues, null, 2)}
      </pre>
    </main>
  )
}

export const App = () => {
  return (
    <>
      <ThemeSynchronizer />
      <Switch>
        <Route path='/' component={Home} />
        <Route path='/playground' component={Playground} />
        {/* TODO */}
        <Route>404: No such page!</Route>
      </Switch>
    </>
  )
}
