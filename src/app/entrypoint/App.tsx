import { Route, Switch } from 'wouter'

import { AddHabit } from '~/pages/add-habit'
import { Home } from '~/pages/home'
import { Path } from '~/shared/constants'
import { ThemeSynchronizer } from '../theme'

export const App = () => {
  return (
    <>
      <ThemeSynchronizer />
      <Switch>
        <Route path={Path.Home} component={Home} />
        <Route path={Path.AddHabit} component={AddHabit} />
        {/* TODO */}
        <Route>404: No such page!</Route>
      </Switch>
    </>
  )
}
