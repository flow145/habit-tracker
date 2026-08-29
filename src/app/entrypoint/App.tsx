import { Route, Switch } from 'wouter'

import { Home } from '~/pages/home'

export const App = () => {
  return (
    <Switch>
      <Route path='/' component={Home} />
      {/* TODO */}
      <Route>404: No such page!</Route>
    </Switch>
  )
}
