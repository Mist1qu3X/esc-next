import axios from 'axios';
import config from './config';

const api = axios.create({
    baseURL: `${config.API_URL}/api`,
    timeout: 10000,
});

export const fetchNews = async (limit = 4) => {
    const res = await api.get(`/news-items?populate=*&sort=date:desc&pagination[limit]=${limit}`);
    return res.data.data;
};

export const fetchEvents = async (limit = 3) => {
    const res = await api.get(`/events?populate=*&sort=date:asc&pagination[limit]=${limit}`);
    return res.data.data;
};

export const fetchChampionship = async () => {
    const res = await api.get('/championships?populate=*');
    return res.data.data[0] || null;
};

export const fetchRankings = async () => {
    const res = await api.get('/rankings?sort=position:asc');
    return res.data.data;
};

export const fetchDocuments = async (limit = 4) => {
    const res = await api.get(`/docs?populate=*&pagination[limit]=${limit}`);
    return res.data.data;
};

export const fetchVideos = async (limit = 3) => {
    const res = await api.get(`/videos?populate=*&pagination[limit]=${limit}`);
    return res.data.data;
};

export const fetchSpotlights = async (limit = 4) => {
    const res = await api.get(`/spotlights?populate=*&pagination[limit]=${limit}`);
    return res.data.data;
};