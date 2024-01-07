import CloseIcon from "@mui/icons-material/Close";
import InboxIcon from "@mui/icons-material/Inbox";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import MuiListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Typography from "@mui/material/Typography";
import { makeStyles, styled, withStyles } from "@mui/styles";
import React, { useState } from "react";
import { useDispatch } from "react-redux";

import { loadExample } from "../actions";

const BootstrapDialog = styled(Dialog)(({ theme }) => ({
	"& .MuiDialogContent-root": {
		background: "white",
		padding: theme.spacing(2)
	},
	"& .MuiDialogActions-root": {
		padding: theme.spacing(1)
	}
}));


const FolderInput = ({ onChange }) => {
  const fileInput = React.useRef(null);

  const handleButtonClick = () => {
    fileInput.current.click();
  };

  return (
    <div>
      <input
        style={{ display: 'none' }}
        ref={fileInput}
        type="file"
        directory="" webkitdirectory=""
        onChange={onChange}
      />
      <Button onClick={handleButtonClick} variant="contained" color="primary">
        Select a new profile folder
      </Button>
    </div>
  );
};

const ListItem = withStyles({
	root: {
		"&$selected": {
			backgroundColor: "blue",
			color: "black",
			"& .MuiListItemIcon-root": {
				color: "black"
			},
			borderRadius: "2px"
		},
		"&$selected:hover": {
			backgroundColor: "purple",
			color: "black",
			"& .MuiListItemIcon-root": {
				color: "black"
			},
			borderRadius: "2px"
		},
		"&:hover": {
			backgroundColor: "#04ACB5",
			color: "black",
			"& .MuiListItemIcon-root": {
				color: "black"
			},
			borderRadius: "2px"
		}
	},
	selected: {}
})(MuiListItem);

const useStyles = makeStyles((theme) => ({
	button: {
		backgroundColor: "#04ACB5",
		color: "white",
		'&:hover': {
			backgroundColor: '#fff',
			color: '#04ACB5',
		}
	},
}));

function BootstrapDialogTitle(props) {
	const { children, onClose, ...other } = props;

	return (
		<DialogTitle sx={{ m: 0, p: 1 }} {...other}>
			{children}
			{onClose ? (
				<IconButton
					aria-label="close"
					onClick={onClose}
					sx={{
						position: "absolute",
						right: 8,
						top: 8
					}}
				>
					<CloseIcon />
				</IconButton>
			) : null}
		</DialogTitle>
	);
}

export default function CustomizedDialogs() {
	const dispatch = useDispatch();
	const classes = useStyles();

	const [open, setOpen] = useState(true);
	const [selectedExample, setSelectedExample] = useState("");

	const examples = { "sgemm-kernel-opt": "SGEMM with kernel optimizations",
					   "sgemm-uvm-opt": "SGEMM with UVM strategies",
					   "gpt2-transformer": "GPT-2 Transformer case study",
					   "bert-transformer-2": "BERT Transformer",
						"comb-post-send-1024_1024_1024": "Comb post-send 1024_1024_1024",
						"comb-post-send-wait-all-scale-up": "Comb post-send wait-all scale-up"
					};

	const handleClickOpen = () => {
		setOpen(true);
	};
	const handleClose = () => {
		if (selectedExample != "") {
			dispatch(loadExample(selectedExample));
			setOpen(false);
		}
	};

	const handleListItemClick = (event, example) => {
		setSelectedExample(example);
	};

	return (
			<BootstrapDialog
				onClose={handleClose}
				aria-labelledby="customized-dialog-title"
				open={open}
			>
				<BootstrapDialogTitle
					id="customized-dialog-title"
					onClose={handleClose}
				>
					Welcome to Data Movement Visualized!
				</BootstrapDialogTitle>
				<DialogContent dividers>
					<Typography gutterBottom>
					In the realm of distributed computation on devices like CPUs and GPUs, efficient <b>data movement</b> between host and devices is key.
					DMVis, is designed for developers working with CUDA-enabled applications to visualize and analyze data movement.
					<br /><br />
					Start by profiling your application using <a style={{margin: "0px"}} href="https://github.com/jarusified/DataMovProfiler">DMTracker</a>. Then, simply select the data folder using "Select a New Profile Folder."
					Dive into previous profiles to understand your application's data movement patterns.
					</Typography>
					<List>
						{Object.entries(examples).map((example, idx) => (
							<ListItem
								key={idx}
								button
								disablePadding
								selected={selectedExample === example[0]}
								onClick={(event) =>
									handleListItemClick(event, example[0])
								}
							>
								<ListItemButton>
									<ListItemIcon>
										<InboxIcon />
									</ListItemIcon>
									<ListItemText primary={example[1]} />
								</ListItemButton>
							</ListItem>
						))}
					</List>
				</DialogContent>
				<DialogActions>
					<FolderInput onChange={handleClose} />
					<Button
						onClick={handleClose}
						className={classes.button}
					>
						Load folder
					</Button>
				</DialogActions>
			</BootstrapDialog>
	);
}
