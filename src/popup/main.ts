import { createApp } from 'vue';
import App from './Popup.vue';
import { setupApp } from '~/logic/common-setup';
import '../styles';
import { SnackbarService } from 'vue3-snackbar';
import 'vue3-snackbar/styles';

const app = createApp(App);
setupApp(app);
app.use(SnackbarService);
app.mount('#app');
