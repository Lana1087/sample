import React from 'react';
import PropTypes from 'prop-types';
import isEmpty from 'lodash/isEmpty';
import keys from 'lodash/keys';
import values from 'lodash/values';
import filter from 'lodash/filter';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { SubmissionError, reset } from 'redux-form';
import * as actionCreators from 'app/actions/actionCreators';
import store from 'app/store';
import {apiUrls, labels} from './_data';
import Tools from 'helpers/Tools';
import PermissionLayout from './Permission.layout';

class Permission extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			mainModal: false,
			itemId: null,
			bulkRemove: false,
			params: {},
			dataLoaded: store.getState().permissionReducer.list.length?true:false
	    };
	    this.list = this.list.bind(this);
	    this.toggleModal = this.toggleModal.bind(this);
	    this.handleSync = this.handleSync.bind(this);
	    this.handleFilter = this.handleFilter.bind(this);
	    this.handleCheck = this.handleCheck.bind(this);
	    this.handleCheckAll = this.handleCheckAll.bind(this);
	    this.handleRemove = this.handleRemove.bind(this);
	    this.handleChange = this.handleChange.bind(this);
	    this.handlePageChange = this.handlePageChange.bind(this);

	    this.filterTimeout = null;
	    this.firstRender = true;

	}

	setInitData(initData){
		this.props.permissionAction('newList', {list: [...initData.data.items], pages: initData.data._meta.last_page});
		this.setState({dataLoaded: true});
	}

	componentDidMount(){
		document.title = 'Permission';
		if(!this.props.permissionReducer.list.length){
			if(window.initData){
				if(window.initData.success){
		    		this.setInitData(window.initData);
				}else{
					// Pop message here
				}
			    window.initData = null;
			}else{
				this.list();
			}
		}
	}

	/*
	shouldComponentUpdate(nextProps, nextState) {
		if(this.firstRender){
			this.firstRender = false;
			return false;
		}
		return true;
	}
	*/


	toggleModal(id=null, state, open=true){
		let newState = {};
		newState[state] = open;

		switch(state){
			case 'mainModal':
				newState.itemId = id;
				if(id && open){
					Tools.apiCall(apiUrls.obj, {id: id}, false).then((result) => {
						if(result.success){
							this.props.permissionAction('obj', {
								...result.data
							});
							this.setState(newState);
							return;
						}
					});
				}else{
					this.props.permissionAction('obj', Tools.getInitData(labels.mainForm));
					this.setState(newState);
				}
			break;
		}

	}

	handleSync(){
		Tools.apiCall(apiUrls.syncList).then((result) => {
	    	if(result.success){
	    		this.setInitData(result);
	    	}
	    });
	}

	list(outerParams={}, page=1){
	    let params = {
	    	page
	    };

		if(!isEmpty(outerParams)){
	    	params = {...params, ...outerParams};
	    }

		Tools.apiCall(apiUrls.list, params, false).then((result) => {
	    	if(result.success){
	    		this.setInitData(result);
	    	}
	    });
	}

	handleFilter(event){
		let keyword = event.target.value;
		if(this.filterTimeout !== null){
			clearTimeout(this.filterTimeout);
		}
		this.filterTimeout = setTimeout(() => {
			if(keyword.length > 2){
				this.list({keyword: keyword});
			}else if(!keyword.length){
				this.list();
			}
		}, 600);
	}

	handlePageChange(data){
		let page = data.selected + 1;
		this.list({}, page);
	}

	handleCheck(id, checked){
		let index = store.getState().permissionReducer.list.findIndex(x => x.id===id);
		this.props.permissionAction('edit', {checked}, index);
	}

	handleCheckAll(){
		let list = this.props.permissionReducer.list;
		if(filter(list, {checked: true}).length === list.length){
			this.props.permissionAction('uncheckAll');
		}else{
			this.props.permissionAction('checkAll');
		}
	}

	handleRemove(id=null){
		const confirm = window.confirm('Do you want to remove this item(s)?');
		if(!confirm){
			return;
		}
		if(id === null){
			let listId = [];
			this.props.permissionReducer.list.map(value => {
				if(value.checked){
					listId.push(value.id);
				}
			});
			if(!listId.length){
				window.alert("Bạn vui lòng chọn ít nhất 1 phần tử để xoá.");
				return;
			}
			id = listId.join(',');
		}else{
			id = String(id);
		}
		Tools.apiCall(apiUrls.remove, {id}).then((result) => {
	    	if(result.success){
	    		let listId = result.data.id;
	    		if(typeof listId !== 'object'){
	    			listId = [listId];
	    		}
	    		let listIndex = listId.map(id => {
					return store.getState().permissionReducer.list.findIndex(x => x.id === parseInt(id));
	    		});
				this.props.permissionAction('remove', null, listIndex);
	    	}
	    });
	}

	handleChange(eventData, dispatch){
		try{
			const params = {...eventData};
			const id = this.state.itemId;
			return Tools.apiCall(apiUrls[id?'edit':'add'], id?{...params, id}:params).then((result) => {
		    	if(result.success){
		    		const data = {
						...result.data
		    		};
		    		if(id){
						let index = store.getState().permissionReducer.list.findIndex(x => x.id===id);
						this.props.permissionAction('edit', data, index);
		    		}else{
						this.props.permissionAction('add', data);
		    		}
		    		dispatch(reset('PermissionMainForm'));
		    		this.toggleModal(null, 'mainModal', false);
		    	}else{
					throw new SubmissionError(Tools.errorMessageProcessing(result.message));
		    	}
		    });
	    }catch(error){
			throw new SubmissionError(Tools.errorMessageProcessing(error));
		}
	}

	render() {
		return (
			<PermissionLayout
				{...this.props}
				dataLoaded={this.state.dataLoaded}
				mainModal={this.state.mainModal}
				bulkRemove={this.state.bulkRemove}
				list={this.list}
				toggleModal={this.toggleModal}
				onFilter={this.handleFilter}
				onCheck={this.handleCheck}
				onCheckAll={this.handleCheckAll}
				onRemove={this.handleRemove}
				onChange={this.handleChange}
				onSync={this.handleSync}
				onPageChange={this.handlePageChange}
				/>
		);
	}
}

function mapStateToProps(state){
	return {
	}
}

function mapDispatchToProps(dispatch){
	return {
		...bindActionCreators(actionCreators, dispatch),
		resetForm: (formName) => {
			dispatch(reset(formName));
		}
	};
}

Permission.propTypes = {
};

Permission.defaultProps = {
};

export default connect(
	mapStateToProps,
	mapDispatchToProps
)(Permission);

// export default Permission;
