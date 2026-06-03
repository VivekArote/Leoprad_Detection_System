const DEFAULT_CAMERAS = [
  { cameraId: 'camera-01', location: 'North Ravine Station' },
  { cameraId: 'camera-02', location: 'River crossing' },
  { cameraId: 'camera-03', location: 'Boundary fence wall' }
];

export const getSystemSettings = () => {
  return {
    confidence: localStorage.getItem('sys_conf_confidence') || '80',
    cooldown: localStorage.getItem('sys_conf_cooldown') || '15',
    port: localStorage.getItem('sys_conf_port') || 'COM3',
    telegram: localStorage.getItem('sys_conf_telegram') || '-100123456789'
  };
};

export const saveSystemSettings = (settings) => {
  localStorage.setItem('sys_conf_confidence', settings.confidence);
  localStorage.setItem('sys_conf_cooldown', settings.cooldown);
  localStorage.setItem('sys_conf_port', settings.port);
  localStorage.setItem('sys_conf_telegram', settings.telegram);
};

export const getRegisteredCameras = () => {
  const cams = localStorage.getItem('sys_cameras');
  if (!cams) {
    localStorage.setItem('sys_cameras', JSON.stringify(DEFAULT_CAMERAS));
    return DEFAULT_CAMERAS;
  }
  return JSON.parse(cams);
};

export const saveRegisteredCameras = (cameras) => {
  localStorage.setItem('sys_cameras', JSON.stringify(cameras));
};
