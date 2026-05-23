use std::sync::Mutex;

pub struct RingBuffer {
    data: Mutex<Vec<u8>>,
    max_bytes: usize,
}

impl RingBuffer {
    pub fn new(max_bytes: usize) -> Self {
        Self {
            data: Mutex::new(Vec::new()),
            max_bytes,
        }
    }

    pub fn write(&self, bytes: &[u8]) {
        let mut data = self.data.lock().unwrap();
        if data.len() + bytes.len() > self.max_bytes {
            let excess = data.len() + bytes.len() - self.max_bytes;
            let drain_to = excess.min(data.len());
            data.drain(..drain_to);
        }
        data.extend_from_slice(bytes);
    }

    pub fn read_since(&self, offset: u64) -> (Vec<u8>, u64) {
        let data = self.data.lock().unwrap();
        let offset = offset as usize;
        if offset >= data.len() {
            return (Vec::new(), data.len() as u64);
        }
        (data[offset..].to_vec(), data.len() as u64)
    }

    #[allow(dead_code)]
    pub fn read_all(&self) -> Vec<u8> {
        self.data.lock().unwrap().clone()
    }

    #[allow(dead_code)]
    pub fn len(&self) -> usize {
        self.data.lock().unwrap().len()
    }
}
