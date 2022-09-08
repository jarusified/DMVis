import React, { useEffect } from 'react';
import { useDispatch, useSelector } from "react-redux";
import PropTypes from 'prop-types';
import SwipeableViews from 'react-swipeable-views';

import { useTheme } from '@mui/material/styles';
import { Paper, Typography } from "@material-ui/core";
import AppBar from '@mui/material/AppBar';
import Grid from '@mui/material/Grid';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';
import { makeStyles } from "@material-ui/core/styles";

import EventSummaryWrapper from "./EventSummaryWrapper";
import BackgroundSummaryWrapper from "./BackgroundSummaryWrapper";
import FilterEventsDropDown from './FilterEventsDropDown';

import { UPDATE_EVENT_SUMMARY } from '../helpers/types';

const useStyles = makeStyles((theme) => ({
    tab: {
        color: '#000',
        background: '#fff'
    },
}));

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
                    {children}
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
    const classes = useStyles();
    const theme = useTheme();
    const dispatch = useDispatch();

    const [tabIndex, setTabIndex] = React.useState(0);
    const [open, setOpen] = React.useState(false);

    const eventSummary = useSelector((store) => store.eventSummary);

    const handleChange = (event, newTabIndex) => {
        setTabIndex(newTabIndex);
    };

    const handleChangeIndex = (index) => {
        setTabIndex(index);
    };

    const handleFilterChange = (value) => {
        setOpen(false);
        // Send a dispatch to update the event summary.
        dispatch({
            type: UPDATE_EVENT_SUMMARY,
            payload: value
        });
    };

    return (
        <Paper>
            <Grid container>
                <Grid item xs={6}>
                    <Typography variant="overline" style={{ fontWeight: "bold" }}>
                        Summary
                    </Typography>
                </Grid>
                <Grid item xs={6} flex justifyContent="flex-end">
                    {eventSummary.length > 0 ? (
                        <FilterEventsDropDown
                            selectedValue={eventSummary}
                            open={open}
                            propagateChange={handleFilterChange}
                        />
                    ) : (<></>)}

                </Grid>
            </Grid>
            <Box sx={{ bgcolor: 'background.paper' }}>
                <AppBar position="static" sx={{ bgcolor: "#f1a340" }}>
                    <Tabs
                        value={tabIndex}
                        className={classes.tab}
                        onChange={handleChange}
                        indicatorColor="#000"
                        variant="fullWidth"
                        aria-label="Aggregated detailed statistics"
                    >
                        <Tab label="Per-event" {...a11yProps(0)} />
                        {/* <Tab label="Per-tensor" {...a11yProps(1)} /> */}
                        <Tab label="Per-epoch" {...a11yProps(2)} />
                    </Tabs>
                </AppBar>
                <SwipeableViews
                    axis={theme.direction === 'rtl' ? 'x-reverse' : 'x'}
                    index={tabIndex}
                    onChangeIndex={handleChangeIndex}
                >
                    <TabPanel value={tabIndex} index={0} dir={theme.direction}>
                        <EventSummaryWrapper />
                    </TabPanel>
                    {/* <TabPanel value={tabIndex} index={1} dir={theme.direction}>
                        Item Two
                    </TabPanel> */}
                    <TabPanel value={tabIndex} index={2} dir={theme.direction}>
                        <BackgroundSummaryWrapper />
                    </TabPanel>
                </SwipeableViews>
            </Box>

        </Paper >
    );
}