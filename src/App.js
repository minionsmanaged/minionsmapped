import React, { Component } from 'react';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHome, faServer } from "@fortawesome/free-solid-svg-icons";
import { faAws, faGoogle, faWindows } from "@fortawesome/free-brands-svg-icons";
import './App.css';

class App extends Component {
  constructor() {
    super();
    this.state = {
      domains: [],
      pools: {},
      runningInstanceCounts: {}
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
        workerPools.forEach(workerPool => this.getRunningInstanceCount(workerPool));
        let domains = workerPools.map(wp => wp.workerPoolId.split('/')[0]).filter((v, i, a) => a.indexOf(v) === i);
        let pools = Object.assign({}, ...domains.map(domain => ({[domain]: workerPools.filter(wp => wp.workerPoolId.startsWith(domain + '/'))})));
        this.setState({ domains, pools });
        if ('continuationToken' in container) {
          fetch('https://firefox-ci-tc.services.mozilla.com/api/worker-manager/v1/worker-pools?continuationToken=' + container.continuationToken)
            .then(response => response.json())
            .then(container => {
              workerPools = workerPools.concat(container.workerPools);
              workerPools.forEach(workerPool => this.getRunningInstanceCount(workerPool));
              domains = workerPools.map(wp => wp.workerPoolId.split('/')[0]).filter((v, i, a) => a.indexOf(v) === i);
              pools = Object.assign({}, ...domains.map(domain => ({[domain]: workerPools.filter(wp => wp.workerPoolId.startsWith(domain + '/'))})));
              this.setState({ domains, pools });
            });
        }
      });
  }

  renderProviderIcon(provider) {
    switch(provider) {
      case 'aws':
        return <FontAwesomeIcon icon={faAws} />;
      case 'azure':
        return <FontAwesomeIcon icon={faWindows} />;
      default:
        return provider.endsWith('-gcp')
          ? <FontAwesomeIcon icon={faGoogle} />
          : <FontAwesomeIcon icon={faHome} />;
    }
  }

  getRunningInstanceCount(pool) {
    // todo: implement running instance count
    let runningInstanceCounts = this.state.runningInstanceCounts;
    if (!(pool.workerPoolId in runningInstanceCounts)) {
      runningInstanceCounts[pool.workerPoolId] = Math.floor(Math.random() * Math.floor(pool.config.maxCapacity));
      this.setState({ runningInstanceCounts });
    }
    return runningInstanceCounts[pool.workerPoolId];
  }

  getRunningInstanceIconCount(pool) {
    return Math.round(((this.getRunningInstanceCount(pool) / pool.config.maxCapacity) * 100) / 10);
  }

  getNonRunningInstanceIconCount(pool) {
    // this function handles js midpoint rounding so that when 2.5/5 rounds up to 3/5 on running instances, we round down to 2/5 on non-running instances
    let runningInstanceIconCount = this.getRunningInstanceIconCount(pool);
    let nonRunningInstanceIconCount = Math.round((((pool.config.maxCapacity - this.getRunningInstanceCount(pool)) / pool.config.maxCapacity) * 100) / 10);
    if ((runningInstanceIconCount + nonRunningInstanceIconCount) > 10) {
      return nonRunningInstanceIconCount - 1;
    }
    return nonRunningInstanceIconCount;
  }

  render() {
    return (
      <div>
        <ul>
        {this.state.domains.map((domain) => (
          <li key={domain}>
            {domain}
            <ul className="fa-ul">
              {this.state.pools[domain].map((pool) => (
                <li key={pool.workerPoolId}>
                  <span className="fa-li">
                    {this.renderProviderIcon(pool.providerId)}
                  </span>
                  <strong>{pool.workerPoolId.split('/')[1]}</strong>
                  <br />
                  {
                    [...Array(this.getRunningInstanceIconCount(pool)).keys()].map((i) => (
                      <FontAwesomeIcon icon={faServer} key={i} style={{marginRight: '2px', color: '#dff883'}} />
                    ))
                  }
                  {
                    [...Array(this.getNonRunningInstanceIconCount(pool)).keys()].map((i) => (
                      <FontAwesomeIcon icon={faServer} key={i} style={{marginRight: '2px', color: '#bebebe'}} />
                    ))
                  }
                  &nbsp;
                  <span style={{fontSize: '80%'}}>
                    {this.getRunningInstanceCount(pool)}/{pool.config.maxCapacity}
                  </span>
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