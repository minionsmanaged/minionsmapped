import React, { Component } from 'react';
import ProgressBar from 'react-bootstrap/ProgressBar';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHome, faTrashAlt } from "@fortawesome/free-solid-svg-icons";
import { faAws, faGoogle, faWindows } from "@fortawesome/free-brands-svg-icons";

Date.prototype.addHours = function(hours){
  this.setHours(this.getHours() + hours);
  return this;
}

class PoolSummary extends Component {
  constructor(props) {
    super(props);
    let pc = this.props.pool.workerPoolId.split('/');
    this.state = {
      instances: [],
      pending: 0,
      domain: (pc.length > 0) ? pc[0] : '',
      pool: (pc.length > 1) ? pc[1] : ''
    };
    this.queryTaskcluster = this.queryTaskcluster.bind(this);
  }
  
  componentDidMount() {
    this.queryTaskcluster();
  }
  
  queryTaskcluster() {
    let instances = [];
    fetch('https://firefox-ci-tc.services.mozilla.com/api/queue/v1/provisioners/' + this.state.domain + '/worker-types/' + this.state.pool + '/workers')
      .then(response => response.json())
      .then(container => {
        instances = instances.concat(container.workers);
        this.setState({ instances });
        if (('continuationToken' in container) && instances.length < this.props.pool.config.maxCapacity) {
          fetch('https://firefox-ci-tc.services.mozilla.com/api/queue/v1/provisioners/' + this.state.domain + '/worker-types/' + this.state.pool + '/workers?continuationToken=' + container.continuationToken)
            .then(response => response.json())
            .then(container => {
              instances = instances.concat(container.workers);
              this.setState({ instances });
              if (('continuationToken' in container) && instances.length < this.props.pool.config.maxCapacity) {
                fetch('https://firefox-ci-tc.services.mozilla.com/api/queue/v1/provisioners/' + this.state.domain + '/worker-types/' + this.state.pool + '/workers?continuationToken=' + container.continuationToken)
                  .then(response => response.json())
                  .then(container => {
                    instances = instances.concat(container.workers);
                    this.setState({ instances });
                    if (('continuationToken' in container) && instances.length < this.props.pool.config.maxCapacity) {
                      fetch('https://firefox-ci-tc.services.mozilla.com/api/queue/v1/provisioners/' + this.state.domain + '/worker-types/' + this.state.pool + '/workers?continuationToken=' + container.continuationToken)
                        .then(response => response.json())
                        .then(container => {
                          instances = instances.concat(container.workers);
                          this.setState({ instances });
                        });
                    }
                  });
              }
            });
        }
      });
    fetch('https://firefox-ci-tc.services.mozilla.com/api/queue/v1/pending/' + this.state.domain + '/' + this.state.pool)
      .then(response => response.json())
      .then(container => {
        let pending = container.pendingTasks;
        this.setState({ pending });
      });
  }

  renderProviderIcon() {
    switch(this.props.pool.providerId) {
      case 'aws':
        return <FontAwesomeIcon icon={faAws} />;
      case 'azure':
        return <FontAwesomeIcon icon={faWindows} />;
      case 'null-provider':
        return <FontAwesomeIcon icon={faTrashAlt} />;
      default:
        return this.props.pool.providerId.endsWith('-gcp')
          ? <FontAwesomeIcon icon={faGoogle} />
          : <FontAwesomeIcon icon={faHome} />;
    }
  }

  render() {
    return (
      <li key={this.props.pool.workerPoolId}>
        <span className="fa-li">
          {this.renderProviderIcon()}
        </span>
        <strong>{this.state.pool}</strong>
        <span style={{fontSize: '80%'}}>
          &nbsp;max: {this.props.pool.config.maxCapacity},
          &nbsp;working: {this.state.instances.filter(i => (('latestTask' in i) && ('firstClaim' in i))).length},
          &nbsp;initialising: {this.state.instances.filter(i => ((!('latestTask' in i) || !('firstClaim' in i)) && ((new Date(i.firstClaim)) > (new Date().addHours(-1))))).length},
          &nbsp;pending: {this.state.pending}
        </span>
        <br />
        <ProgressBar>
          <ProgressBar striped variant="success" now={Math.min(this.props.pool.config.maxCapacity, this.state.instances.filter(i => (('latestTask' in i) && ('firstClaim' in i))).length)} max={this.props.pool.config.maxCapacity} key={1} />
          <ProgressBar striped now={Math.min(this.props.pool.config.maxCapacity, this.state.instances.filter(i => ((!('latestTask' in i) || !('firstClaim' in i)) && ((new Date(i.firstClaim)) > (new Date().addHours(-1))))).length)} max={this.props.pool.config.maxCapacity} key={2} />
        </ProgressBar>
      </li>
    );
  }
}

export default PoolSummary;