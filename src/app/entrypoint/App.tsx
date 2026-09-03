import { Route, Switch } from 'wouter'

import { Home } from '~/pages/home'
import { ThemeSynchronizer } from '../theme'

export const App = () => {
  return (
    <>
      <ThemeSynchronizer />
      <Switch>
        <Route path='/' component={Home} />
        {/* TODO */}
        <Route>404: No such page!</Route>
      </Switch>
    </>
  )
}
