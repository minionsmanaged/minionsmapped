import React, { Component } from 'react';
import PoolSummary from './PoolSummary';


class DomainSummary extends Component {

  constructor(props) {
    super(props);
    this.state = {
    };
  }

  renderPoolSummaryComponent(pool, filter) {
    let platform;
    if (pool.providerId in filter.platform) {
      platform = pool.providerId;
    } else if (pool.providerId.endsWith('-gcp')) {
      platform = 'google';
    }
    let level;
    if (pool.providerId.includes('-level1-') || (pool.workerPoolId.split('/')[0].endsWith('-1'))) {
      level = 'one';
    } else if (pool.providerId.includes('-level3-') || (pool.workerPoolId.split('/')[0].endsWith('-3'))) {
      level = 'three';
    } else if (pool.providerId.includes('-test-') || (pool.workerPoolId.split('/')[0].endsWith('-t'))) {
      level = 'test';
    } else {
      level = 'none';
    }
    return ((!filter.platform[platform]) && (!filter.provider[pool.providerId]) && (!filter.level[level]))
      ? <PoolSummary pool={pool} key={pool.workerPoolId} />
      : '';
  }

  render() {
    return (
      <li>
        {this.props.domain}
        <ul className="fa-ul">
          {this.props.pools.map((pool) => (
            this.renderPoolSummaryComponent(pool, this.props.filter)
          ))}
        </ul>
      </li>
    );
  }
}

export default DomainSummary;