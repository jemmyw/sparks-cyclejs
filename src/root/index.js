import {Observable} from 'rx'
import isolate from '@cycle/isolate'

import Landing from './Landing'
import Confirm from './Confirm'
import Dash from './Dash'
import Admin from './Admin'
import Project from './Project'

import {nestedComponent} from 'helpers/router'

import {log} from 'helpers'

import './styles.scss'

// Route definitions at this level
const routes = {
  '/': Landing,
  '/confirm/:id': id => sources => isolate(Confirm)(sources),
  '/dash': isolate(Dash),
  '/admin': isolate(Admin),
  '/project/:key': key => sources => Project({
    project$: sources.firebase('Projects',key),
    ...sources,
  }),
}

export default sources => {
  // get queue response stream based on auth'd uid
  const responses$ = sources.auth$
    .flatMapLatest(auth => auth ? sources.queue$(auth.uid) : Observable.empty())

  responses$.subscribe(log('responses$'))

  const userProfileKey$ = sources.auth$
    .flatMapLatest(auth =>
      auth ? sources.firebase('Users',auth.uid) : Observable.just(null)
    )

  const userProfile$ = userProfileKey$
    .distinctUntilChanged()
    .flatMapLatest(key =>
      key ? sources.firebase('Profiles',key) : Observable.just(null)
    )

  // sources.auth$.subscribe(log('auth$'))
  // userProfileKey$.subscribe(log('userProfileKey$'))
  // userProfile$.subscribe(log('userProfile$'))

  // these two redirects are passed on to child components
  // who simply plug them into their route$ sink
  // if they want this behavior
  const redirectLogin$ = userProfile$
    .filter(profile => !!profile)
    .map(profile => profile.isAdmin ? '/admin' : '/dash')

  const redirectLogout$ = sources.auth$
    .filter(profile => !profile)
    .map(() => '/')

  const redirectUnconfirmed$ = userProfileKey$
    .withLatestFrom(sources.auth$)
    .filter(([profile,auth]) => !profile && !!auth)
    .map(() => '/confirm')

  // redirectUnconfirmed$.subscribe(log('redirectUnconfirmed$'))

  const page$ = nestedComponent(sources.router.define(routes),{
    responses$, userProfileKey$, userProfile$, redirectLogin$, redirectLogout$,
    ...sources,
  })

  // inject authed uid into tasks on their way to sink
  // const authedRequests$ = page$
  //   .flatMapLatest(({queue$}) => queue$ || Observable.never())
  //   .withLatestFrom(sources.auth$)

  // the only global redirect that always gets hooked up is for unconfirmed
  const router = page$
    .flatMapLatest(({route$}) => route$ || Observable.never())
    .merge(redirectUnconfirmed$)

  router.subscribe(log('router'))

  return {
    DOM: page$.flatMapLatest(({DOM}) => DOM),
    auth$: page$.flatMapLatest(({auth$}) => auth$ || Observable.never()),
    queue$: page$.flatMapLatest(({queue$}) => queue$ || Observable.never()),
    router,
  }
}
