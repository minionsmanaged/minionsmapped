import React, { Component } from 'react';
import './App.css';

class App extends Component {
  constructor() {
    super();
    this.state = {
      domains: [],
      pools: {
        'gecko-1': []
      }
    };
    this.queryTaskcluster = this.queryTaskcluster.bind(this);
  }
  
  componentDidMount() {
    this.queryTaskcluster();
  }
  
  queryTaskcluster() {
    let workerPools = [];
    fetch('https://firefox-ci-tc.services.mozilla.com/api/worker-manager/v1/worker-pools')
      .then(response => response.json())
      .then(container => {
        workerPools = workerPools.concat(container.workerPools);
        let domains = workerPools.map(wp => wp.workerPoolId.split('/')[0]).filter((v, i, a) => a.indexOf(v) === i);
        let pools = Object.assign({}, ...domains.map(domain => ({[domain]: workerPools.filter(wp => wp.workerPoolId.startsWith(domain + '/'))})));
        this.setState({ domains, pools });
        if ('continuationToken' in container) {
          fetch('https://firefox-ci-tc.services.mozilla.com/api/worker-manager/v1/worker-pools?continuationToken=' + container.continuationToken)
            .then(response => response.json())
            .then(container => {
              workerPools = workerPools.concat(container.workerPools);
              domains = workerPools.map(wp => wp.workerPoolId.split('/')[0]).filter((v, i, a) => a.indexOf(v) === i);
              pools = Object.assign({}, ...domains.map(domain => ({[domain]: workerPools.filter(wp => wp.workerPoolId.startsWith(domain + '/'))})));
              this.setState({ domains, pools });
            });
        }
      });
  }

  render() {
    return (
      <div>
        <ul>
        {this.state.domains.map((domain) => (
          <li key={domain}>
            {domain}
            <ul>
              {this.state.pools[domain].map((pool) => (
                <li key={pool.workerPoolId}>
                  {pool.workerPoolId.split('/')[1]} ({pool.providerId})
                </li>
              ))}
            </ul>
          </li>
        ))}
        </ul>
      </div>
    );
  }
}

export default App;