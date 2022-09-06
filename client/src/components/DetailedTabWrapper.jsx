import * as React from 'react';
import PropTypes from 'prop-types';
import SwipeableViews from 'react-swipeable-views';

import { useTheme } from '@mui/material/styles';
import { Paper, Typography } from "@material-ui/core";
import AppBar from '@mui/material/AppBar';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';

function TabPanel(props) {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`full-width-tabpanel-${index}`}
            aria-labelledby={`full-width-tab-${index}`}
            {...other}
        >
            {value === index && (
                <Box sx={{ p: 3 }}>
                    <Typography>{children}</Typography>
                </Box>
            )}
        </div>
    );
}

TabPanel.propTypes = {
    children: PropTypes.node,
    index: PropTypes.number.isRequired,
    value: PropTypes.number.isRequired,
};

function a11yProps(index) {
    return {
        id: `full-width-tab-${index}`,
        'aria-controls': `full-width-tabpanel-${index}`,
    };
}

export default function DetailedTabWrapper() {
    const theme = useTheme();
    const [value, setValue] = React.useState(0);

    const handleChange = (event, newValue) => {
        setValue(newValue);
    };

    const handleChangeIndex = (index) => {
        setValue(index);
    };

    return (
        <Paper>
            <Typography variant="overline" style={{ fontWeight: "bold" }}>
                Detailed
            </Typography>
            <Box sx={{ bgcolor: 'background.paper' }}>
                <AppBar position="static" sx={{ bgcolor: "#f1a340" }}>
                    <Tabs
                        value={value}
                        textColor="#000"
                        onChange={handleChange}
                        indicatorColor="#f00"
                        variant="fullWidth"
                        aria-label="Aggregated detailed statistics"
                    >
                        <Tab label="Per-event" {...a11yProps(0)} />
                        <Tab label="Per-tensor" {...a11yProps(1)} />
                        <Tab label="Per-epoch" {...a11yProps(2)} />
                    </Tabs>
                </AppBar>
                <SwipeableViews
                    axis={theme.direction === 'rtl' ? 'x-reverse' : 'x'}
                    index={value}
                    onChangeIndex={handleChangeIndex}
                >
                    <TabPanel value={value} index={0} dir={theme.direction}>
                        Item One
                    </TabPanel>
                    <TabPanel value={value} index={1} dir={theme.direction}>
                        Item Two
                    </TabPanel>
                    <TabPanel value={value} index={2} dir={theme.direction}>
                        Item Three
                    </TabPanel>
                </SwipeableViews>
            </Box>

        </Paper>
    );
}
