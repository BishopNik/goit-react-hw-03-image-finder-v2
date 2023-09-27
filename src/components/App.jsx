/** @format */

import { Component } from 'react';
import { BsFillCaretDownSquareFill } from 'react-icons/bs';
import { Notify } from 'notiflix';
import Gallery from './gallery';
import Searchbar from './searchbar';
import Modal from './modal';
import Button from 'components/button';
import Loader from 'components/loader';
import ErrorComponent from 'components/service/error';
import { fetchImage } from 'components/service/fetch_api';
import './style.css';
import 'components/gallery/style.css';

class App extends Component {
	state = {
		searchItem: '',
		isModalShow: false,
		isNewSearch: false,
		bigImgShow: '',
		page: 1,
		perPage: 12,
		foundImages: [],
		countFoundItem: 0,
		countPage: 0,
		statusComponent: null,
		error: null,
	};

	componentDidUpdate = (prevProps, prevState) => {
		const { perPage, countPage, page, searchItem, isNewSearch } = this.state;
		if (
			prevState.searchItem !== searchItem ||
			(prevState.isNewSearch !== isNewSearch && isNewSearch === true) ||
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
				.finally(this.handlerSearchComplete());
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

	handlerChangeSearchValue = value => {
		this.setState({ searchItem: value, isNewSearch: true });
	};

	handlerSearchComplete = value => {
		this.setState({ isNewSearch: false });
	};

	handleClick = bigImageSrc => {
		this.setState({ isModalShow: true, bigImgShow: bigImageSrc });
	};

	handlerCloseModal = () => {
		this.setState(({ isModalShow }) => ({ isModalShow: !isModalShow }));
	};

	render() {
		const {
			isModalShow,
			searchItem,
			bigImgShow,
			statusComponent,
			foundImages,
			page,
			countPage,
			error,
		} = this.state;
		return (
			<div className='container'>
				{isModalShow && (
					<Modal onClose={this.handlerCloseModal}>
						<img src={bigImgShow} alt='Big Search Element' />
					</Modal>
				)}

				<Searchbar handlerSearch={this.handlerChangeSearchValue} />

				{statusComponent === 'pending' && <Loader />}

				{statusComponent !== 'rejected' && (
					<>
						{foundImages.length > 0 ? (
							<>
								<Gallery images={foundImages} onClickBigImage={this.handleClick} />
								{page > 0 && countPage > 0 && (
									<div className='status-container'>
										<div className='page-stat'>
											<div className='page-count'>
												images: {foundImages.length}
											</div>
										</div>
										{page > 0 && countPage > 0 && page !== countPage && (
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
							</>
						) : (
							searchItem !== '' &&
							foundImages.length === 0 &&
							statusComponent === 'resolved' && (
								<ErrorComponent>
									Images <span className='search-item'>{searchItem}</span> not
									found
								</ErrorComponent>
							)
						)}
					</>
				)}

				{statusComponent === 'rejected' && (
					<ErrorComponent className={'error'}>{error}</ErrorComponent>
				)}
			</div>
		);
	}
}

export default App;

// if (statusComponent !== 'rejected') {
// 	return (
// 		<>
// 			<ul className='gallery-container'>
// 				{foundImages.length > 0
// 					? foundImages.map(item => (
// 							<ImageItem
// 								key={item.id}
// 								srcUrl={item.webformatURL}
// 								dataset={item.largeImageURL}
// 								tags={item.tags}
// 								onClick={this.handleClick}
// 							/>
// 					  ))
// 					: searchItem !== '' &&
// 					  foundImages.length === 0 &&
// 					  statusComponent === 'resolved' && (
// 							<ErrorComponent>
// 								Images <span className='search-item'>{searchItem}</span> not
// 								found
// 							</ErrorComponent>
// 					  )}
// 			</ul>
// 			{page > 0 && countPage > 0 && foundImages.length > 0 && (
// 				<div className='status-container'>
// 					<div className='page-stat'>
// 						<div className='page-count'>images: {foundImages.length}</div>
// 					</div>
// 					{countPage > page && (
// 						<Button
// 							className={'loadmore'}
// 							type={'button'}
// 							onClick={() => this.changePage(1)}
// 						>
// 							<BsFillCaretDownSquareFill />
// 						</Button>
// 					)}
// 				</div>
// 			)}
// 			{statusComponent === 'pending' ? <Loader /> : null};
// 		</>
// 	);
// }
