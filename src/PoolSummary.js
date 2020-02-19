import React, { Component } from 'react';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHome, faServer } from "@fortawesome/free-solid-svg-icons";
import { faAws, faGoogle, faWindows } from "@fortawesome/free-brands-svg-icons";

class PoolSummary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      runningInstanceCount: Math.floor(Math.random() * Math.floor(this.props.pool.config.maxCapacity))
    };
  }

  renderProviderIcon() {
    switch(this.props.pool.providerId) {
      case 'aws':
        return <FontAwesomeIcon icon={faAws} />;
      case 'azure':
        return <FontAwesomeIcon icon={faWindows} />;
      default:
        return this.props.pool.providerId.endsWith('-gcp')
          ? <FontAwesomeIcon icon={faGoogle} />
          : <FontAwesomeIcon icon={faHome} />;
    }
  }

  getRunningInstanceCount() {
    // todo: implement running instance count
    let runningInstanceCount = this.state.runningInstanceCount;
    if (runningInstanceCount < 0) {
      runningInstanceCount = Math.floor(Math.random() * Math.floor(this.props.pool.config.maxCapacity));
      this.setState({ runningInstanceCount });
    }
    return runningInstanceCount;
  }

  getRunningInstanceIconCount() {
    return Math.round(((this.getRunningInstanceCount() / this.props.pool.config.maxCapacity) * 100) / 10);
  }

  getNonRunningInstanceIconCount() {
    // this function handles js midpoint rounding so that when 2.5/5 rounds up to 3/5 on running instances, we round down to 2/5 on non-running instances
    let runningInstanceIconCount = this.getRunningInstanceIconCount();
    let nonRunningInstanceIconCount = Math.round((((this.props.pool.config.maxCapacity - this.getRunningInstanceCount()) / this.props.pool.config.maxCapacity) * 100) / 10);
    if ((runningInstanceIconCount + nonRunningInstanceIconCount) > 10) {
      return nonRunningInstanceIconCount - 1;
    }
    return nonRunningInstanceIconCount;
  }

  render() {
    return (
      <li key={this.props.pool.workerPoolId}>
        <span className="fa-li">
          {this.renderProviderIcon()}
        </span>
        <strong>{this.props.pool.workerPoolId.split('/')[1]}</strong>
        <br />
        {
          [...Array(this.getRunningInstanceIconCount()).keys()].map((i) => (
            <FontAwesomeIcon icon={faServer} key={i} style={{marginRight: '2px', color: '#dff883'}} />
          ))
        }
        {
          [...Array(this.getNonRunningInstanceIconCount()).keys()].map((i) => (
            <FontAwesomeIcon icon={faServer} key={i} style={{marginRight: '2px', color: '#bebebe'}} />
          ))
        }
        &nbsp;
        <span style={{fontSize: '80%'}}>
          {this.getRunningInstanceCount()}/{this.props.pool.config.maxCapacity}
        </span>
      </li>
    );
  }
}

export default PoolSummary;