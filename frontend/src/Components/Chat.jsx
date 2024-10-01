// import axios from 'axios';
import React, {
  useEffect, useRef, useState,
} from 'react';
import { connect, useDispatch, useSelector } from 'react-redux';
import { Button, InputGroup, Form } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { ToastContainer, toast } from 'react-toastify';
import filter from 'leo-profanity';
import getModal from './Modals/index.js';
import 'react-toastify/dist/ReactToastify.css';
import { addStartMessages, setCurrentText } from '../slices/messagesSlice.js';
import { addStartChannels } from '../slices/channelsSlice.js';
import Channels from './Channels.jsx';
import Messages from './Messages.jsx';
import DispatchChanges from '../socket.js';
import { mapStateToProps } from './helpers.js';
// import routes from '../routes.js';
import { showModal } from '../slices/modalsSlice.js';
import { logOut } from '../slices/userSlice.js';
import { useStartChannelsQuery, useStartMessagesQuery, useAddMessageMutation } from '../services/api.js';

const PageChat = ({ messagesReducer, channelsReducer }) => {
  const { modalInfo } = useSelector((state) => state.modalsReducer);
  const renderModal = ({ notify }) => {
    if (!modalInfo.type) {
      return null;
    }

    const Component = getModal(modalInfo.type);
    return (
      <Component
        notify={notify}
      />
    );
  };

  const { t } = useTranslation();
  const ref = useRef(null);
  const { channelId, channels } = channelsReducer;
  const { messages, currentText } = messagesReducer;
  const { username } = useSelector((state) => state.userReducer);
  const dispatch = useDispatch();
  const [isConnected, setIsConnected] = useState(false);
  const { data: startChannels } = useStartChannelsQuery();
  const { data: startMessages, refetch } = useStartMessagesQuery();
  const [addMessage] = useAddMessageMutation();
  const notify = (message, move, err = false) => () => {
    if (move) {
      return ((err) ? toast.error(message) : toast.success(message));
    }
    return null;
  };

  // const fetchData = useCallback(async () => {
  //   const startChannels = await axios.get(routes.channelsPath(), { headers: getAuthHeader() })
  //     .catch(() => {
  //       notify(`${t('toasts.error')}`, true, true);
  //     });
  //   const startMessages = await axios.get(routes.messagesPath(), { headers: getAuthHeader() })
  //     .catch(() => {
  //       notify(`${t('toasts.error')}`, true, true);
  //     });
  //   if (startChannels) {
  //     dispatch(addStartChannels(startChannels.data));
  //   }
  //   if (startMessages) {
  //     dispatch(addStartMessages(startMessages.data));
  //   }
  // }, [dispatch, t]);

  useEffect(() => {
    if (isConnected) {
      refetch();
      dispatch(addStartChannels(startChannels));
      dispatch(addStartMessages(startMessages));
    }
  }, [isConnected, dispatch, startChannels, startMessages, refetch]);

  useEffect(() => {
    DispatchChanges(dispatch, setIsConnected);
  }, [dispatch]);

  const GetActiveChannel = () => {
    const [activeChannel] = channels.filter((channel) => Number(channel.id) === Number(channelId));
    return (
      (activeChannel) ? activeChannel.name : null
    );
  };
  const getAmountMessages = () => messages
    .filter((message) => Number(message.channelId) === Number(channelId)).length;

  const newTextMessage = (e) => {
    dispatch(setCurrentText(e.target.value));
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    const filtedMessage = filter.clean(currentText);
    const newMessage = {
      body: filtedMessage,
      channelId: channelId.toString(),
      username,
    };
    await addMessage(newMessage)
      .unwrap()
      .catch(() => {
        notify(`${t('toasts.error')}`, true, true)();
      });
    dispatch(setCurrentText(''));
  };

  useEffect(() => {
    ref.current.focus();
  }, [currentText, channelId]);

  return (
    <>
      <div className="h-100" id="chat">
        <div className="d-flex flex-column h-100">
          <nav className="shadow-sm navbar navbar-expand-lg navbar-light bg-white">
            <div className="container">
              <a className="navbar-brand" href="/">{t('logo')}</a>
              <Button onClick={() => dispatch(logOut())}>{t('chat.logOut')}</Button>
            </div>
          </nav>
          <div className="container my-4 overflow-hidden rounded shadow" style={{ height: '85vh' }}>
            <div className="row h-100 bg-white flex-md-row">
              <div className="col-4 col-md-2 border-end px-0 bg-light flex-column h-100 d-flex">
                <div className="d-flex mt-1 justify-content-between mb-2 ps-4 pe-2 p-4">
                  <b className="p-2">{t('chat.channels')}</b>
                  <Button
                    type="button"
                    variant="outline-primary"
                    onClick={() => dispatch(showModal({ type: 'adding', item: null }))}
                  >
                    {t('chat.add')}
                  </Button>
                </div>
                <Channels />
              </div>
              <div className="col p-0 h-100">
                <div className="d-flex flex-column h-100">
                  <div className="bg-light mb-4 p-3 shadow-sm small">
                    <p className="m-0">
                      <b>
                        <span className="me-1">{t('chat.labelChannel')}</span>
                        <GetActiveChannel />
                      </b>
                    </p>
                    <span className="text-muted">{t('chat.messages.key', { count: getAmountMessages() })}</span>
                  </div>
                  <Messages />
                  <div className="mt-auto px-5 py-3">
                    <Form onSubmit={sendMessage}>
                      <InputGroup>
                        <Form.Control
                          ref={ref}
                          name="body"
                          aria-label="Новое сообщение"
                          placeholder={t('chat.write')}
                          value={messagesReducer.currentText}
                          onChange={newTextMessage}
                          aria-describedby="basic-addon2"
                        />
                        <Button
                          disabled={messagesReducer.currentText.length === 0}
                          type="submit"
                          variant="outline-primary"
                          id="button-addon2"
                        >
                          {t('chat.send')}
                        </Button>
                      </InputGroup>
                    </Form>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <ToastContainer />
      </div>
      {renderModal({ notify })}
    </>
  );
};

export default connect(mapStateToProps)(PageChat);
