import { Redirect, Route, Router, Switch } from 'wouter'

import { AddHabit } from '~/pages/add-habit'
import { EditHabit } from '~/pages/edit-habit'
import { Home } from '~/pages/home'
import { Settings } from '~/pages/settings'
import { Path } from '~/shared/constants'
import { ThemeSynchronizer } from '~/shared/theme'

import { HabitStoreSynchronizer } from '../HabitStoreSynchronizer'

export const App = () => {
  return (
    <Router>
      <HabitStoreSynchronizer />
      <ThemeSynchronizer />
      <Switch>
        <Route path={Path.Home} component={Home} />
        <Route path={Path.AddHabit} component={AddHabit} />
        <Route path={`${Path.EditHabit}/:id`} component={EditHabit} />
        <Route path={Path.Settings} component={Settings} />
        <Route>
          <Redirect to={Path.Home} />
        </Route>
      </Switch>
    </Router>
  )
}
