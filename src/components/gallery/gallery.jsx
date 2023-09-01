/** @format */

import { Component } from 'react';
import PropTypes from 'prop-types';
import { BsFillCaretDownSquareFill } from 'react-icons/bs';
import { Notify } from 'notiflix';
import { fetchImage } from '../service/fetch_api';
import ImageItem from '../galleryitem';
import Button from '../button';
import Loader from '../loader';
import { ErrorComponent } from '../service/error';
import './style.css';

class ImageGallery extends Component {
	state = {
		searchItem: '',
		page: 1,
		perPage: 12,
		foundImages: [],
		countFoundItem: 0,
		countPage: 0,
		isLoading: false,
		statusComponent: null,
		error: null,
	};

	static propTypes = {
		searchItem: PropTypes.string.isRequired,
		isNewSearch: PropTypes.bool.isRequired,
		onClickBigImage: PropTypes.func.isRequired,
		onSearchCompeted: PropTypes.func.isRequired,
	};

	componentDidUpdate = (prevProps, prevState) => {
		const { perPage, countPage, page } = this.state;
		const { searchItem, isNewSearch, onSearchCompeted } = this.props;
		if (
			prevProps.searchItem !== searchItem ||
			(prevProps.isNewSearch !== isNewSearch && isNewSearch === true) ||
			(prevState.page !== page && page !== 1)
		) {
			this.setState({
				statusComponent: 'pending',
				searchItem,
				page: isNewSearch ? 1 : page,
				foundImages: isNewSearch ? [] : this.state.foundImages,
				countPage: isNewSearch ? 0 : this.state.countPage,
			});

			fetchImage({
				searchItem,
				page: isNewSearch ? 1 : page,
				perPage,
			})
				.then(({ hits, totalHits }) => {
					const foundImages = [];
					console.log('RUN', hits);
					hits.forEach(({ id, webformatURL, largeImageURL, tags }) => {
						if (id && webformatURL && largeImageURL && tags) {
							foundImages.push({ id, webformatURL, largeImageURL, tags });
						}
					});
					const pages = isNewSearch ? Math.ceil(totalHits / perPage) : countPage;
					this.setState(prevState => ({
						foundImages: isNewSearch
							? [...foundImages]
							: [...prevState.foundImages, ...foundImages],
						countFoundItem: totalHits,
						countPage: pages,
						statusComponent: 'resolved',
					}));
				})
				.catch(({ message }) => {
					this.setState({
						statusComponent: 'rejected',
						error: message,
					});
					Notify.failure('Unable to load results. ' + message);
				})
				.finally(onSearchCompeted);
		}
	};

	changePage = pg => {
		this.setState(prevState => {
			if (0 < prevState.page && prevState.page <= this.state.countPage) {
				return {
					page: prevState.page + pg,
				};
			}
			return null;
		});
	};

	handleClick = ({ target }) => {
		const bigImageSrc = target.dataset.largeurl;
		this.props.onClickBigImage(bigImageSrc);
	};

	render() {
		const { page, countPage, searchItem, statusComponent, foundImages, error } = this.state;
		if (statusComponent !== 'rejected') {
			return (
				<>
					<ul className='gallery-container'>
						{foundImages.length > 0
							? foundImages.map(item => (
									<ImageItem
										key={item.id}
										srcUrl={item.webformatURL}
										dataset={item.largeImageURL}
										tags={item.tags}
										onClick={this.handleClick}
									/>
							  ))
							: searchItem !== '' &&
							  foundImages.length === 0 &&
							  statusComponent === 'resolved' && (
									<ErrorComponent>
										Images <span className='search-item'>{searchItem}</span> not
										found
									</ErrorComponent>
							  )}
					</ul>
					{page > 0 && countPage > 0 && foundImages.length > 0 && (
						<div className='status-container'>
							<div className='page-stat'>
								<div className='page-count'>images: {foundImages.length}</div>
							</div>
							{countPage > page && (
								<Button
									className={'loadmore'}
									type={'button'}
									onClick={() => this.changePage(1)}
								>
									<BsFillCaretDownSquareFill />
								</Button>
							)}
						</div>
					)}
					{statusComponent === 'pending' ? <Loader /> : null};
				</>
			);
		}

		if (statusComponent === 'rejected') {
			return <ErrorComponent className={'error'}>{error}</ErrorComponent>;
		}
	}
}

export default ImageGallery;
