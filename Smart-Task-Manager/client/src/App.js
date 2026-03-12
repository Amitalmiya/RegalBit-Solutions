import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import LoginPage from './components/Login';
import Dashboard from './components/Dashboard';
import TaskList from './components/TaskList';

function App() {
    return (
        <Router>
            <Switch>
                <Route exact path="/" component={LoginPage} />
                <Route path="/dashboard" component={Dashboard} />
                <Route path="/tasks" component={TaskList} />
            </Switch>
        </Router>
    );
}

export default App;
