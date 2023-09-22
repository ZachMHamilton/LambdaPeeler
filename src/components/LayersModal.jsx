import React from 'react';
import { useState, useEffect } from 'react';
import { Modal, Box, Button, Checkbox, FormControlLabel, Typography } from '@mui/material';
import CircularProgress from '@mui/material/CircularProgress';
import LinearProgress from '@mui/material/LinearProgress';
import axios from 'axios';
import { useTheme } from "@mui/material/styles";

const LayersModal = ({
  open, closeFunction, isLoading, layers, onSubmit
}) => {


  // used for the loading bar
  const [progress, setProgress] = useState(0);
    // used for MUI styling
    const theme = useTheme();

  useEffect(() => {
    // if loading, increment progress bar by 1 to visualize loading progress
    if (isLoading) {
      const interval = setInterval(() => {
        setProgress((prevProgress) => {
          if (prevProgress >= 100) {
            clearInterval(interval);
            return 100;
          }
          return prevProgress + 1.1;
        });
      }, 100);
    }
    setProgress(0);
  }, [isLoading]);
  

  return(
    <div>
    <Modal open={open}>
      <Box
        sx={{
          p: 3,
          height: 500,
          width: 300,
          border: '1px solid black',
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'flex-start',
          flexDirection: 'column',
          bgcolor: 'white',
          boxShadow: 24,
          borderRadius: 4,
          textAlign: 'left',
          outline: 'none',
        }}
      >
        {/* renders the layer names with checkboxes */}
          <form onSubmit={onSubmit}>
            {layers.map((layer) => (
              <FormControlLabel
              key={layer.name + 'FormControlLabel'}
                control={<Checkbox name={layer.name} />}
                label={layer.name}
              />
            ))}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: 10,
              width: '100%',
              position: 'absolute',
              bottom: 20,
              margin: 0,
              padding: 0,
              left: 0,
              }}>
            <Button type="submit" variant="contained" sx={{width: '40%', '&:hover': {boxShadow: 2}}} style={{margin: 0, backgroundColor: theme.palette.primary.main, '&:hover': {
              backgroundColor: theme.palette.primary.main, boxShadow: 2
            }}}>
              Link
            </Button>
            <Button onClick={closeFunction} variant="outlined" sx={{width: '40%', m: 0, p:0, '&:hover': {boxShadow: 2}}} style={{margin: 0}}>
              Close
            </Button>
            </div>
          </form>
        {/* renders the  loading bar after submission*/}
        {isLoading && (
          <div
            style={{
              position: 'absolute',
              bottom: 70,
              left: 34,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              zIndex: 10,
              width: '80%',
            }}
          >
            <Typography variant="caption" component="div">
              Testing Compatibility
            </Typography>
            <Box sx={{ width: '100%' }}>
              <LinearProgress variant='determinate' value={progress}/>
            </Box>
          </div>
        )}
      </Box>
    </Modal>
  </div>
  )

}

export default LayersModal;